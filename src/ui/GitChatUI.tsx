/**
 * Git-focused chat UI component
 */

import { render, Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useEffect, useCallback } from 'react';
import type { Message, SetupStatus, ToolDisplayMode, GitRepository, GitWorkflow, ChatSession } from '../types.js';
import type { GitTheaterClient } from '../theater-client.js';
import type { ChannelStream } from 'theater-client';
import { MultiLineInput } from './MultiLineInput.js';

interface GitChatAppProps {
  client: GitTheaterClient;
  session: ChatSession;
  repository: GitRepository;
  workflow: GitWorkflow;
}

interface GitHeaderProps {
  repository: GitRepository;
  workflow: GitWorkflow;
  setupStatus: SetupStatus;
  setupMessage: string;
}

interface MessageComponentProps {
  message: Message;
  toolDisplayMode: ToolDisplayMode;
}

/**
 * Main Git Chat application
 */
function GitChatApp({ client, session, repository, workflow }: GitChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [channel, setChannel] = useState<ChannelStream | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('connecting');
  const [setupMessage, setSetupMessage] = useState<string>('Connecting to Theater...');
  const [toolDisplayMode, setToolDisplayMode] = useState<ToolDisplayMode>('minimal');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const { exit } = useApp();

  // Setup steps for git workflows
  const setupSteps = {
    connecting: 'Connecting to Theater...',
    opening_channel: 'Opening communication channel...',
    loading_actor: `Starting ${workflow} workflow...`,
    ready: `${workflow.charAt(0).toUpperCase() + workflow.slice(1)} workflow ready!`
  };

  // Add message helper
  const addMessage = useCallback((role: Message['role'], content: string, status: Message['status'] = 'complete', toolName?: string, toolArgs?: string[]) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: new Date(),
      status,
      ...(toolName && { toolName }),
      ...(toolArgs && { toolArgs })
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Add pending message helper
  const addPendingMessage = useCallback((role: Message['role'], content: string) => {
    addMessage(role, content, 'pending');
  }, [addMessage]);

  // Tool message handler
  const addToolMessage = useCallback((toolName: string, args: any[]) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const toolMessage: Message = {
        role: 'tool',
        content: '',
        timestamp: new Date(),
        status: 'complete',
        toolName,
        toolArgs: args
      };

      // Insert tool message before last assistant message
      const lastAssistantIndex = newMessages.map(m => m.role).lastIndexOf('assistant');
      if (lastAssistantIndex !== -1) {
        newMessages.splice(lastAssistantIndex, 0, toolMessage);
        return newMessages;
      } else {
        return [...prev, toolMessage];
      }
    });
  }, []);

  // Setup channel communication
  useEffect(() => {
    async function setupChannel() {
      try {
        setSetupStatus('connecting');
        setSetupMessage(setupSteps.connecting);
        await new Promise(resolve => setTimeout(resolve, 500));

        setSetupStatus('opening_channel');
        setSetupMessage(setupSteps.opening_channel);

        const channelStream = await client.openChannelStream(session.chatActorId);

        setSetupStatus('loading_actor');
        setSetupMessage(setupSteps.loading_actor);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set up message handler
        channelStream.onMessage((message) => {
          try {
            const messageText = Buffer.from(message.data).toString('utf8');
            const parsedMessage = JSON.parse(messageText);

            if (parsedMessage.type === 'chat_message' && parsedMessage.message) {
              const messageEntry = parsedMessage?.message?.entry;
              const isUserMessage = messageEntry?.Message?.role === 'user';

              // Only show assistant messages
              if (!isUserMessage) {
                const messageContent = messageEntry?.Message?.content || messageEntry?.Completion?.content;

                if (Array.isArray(messageContent)) {
                  let fullContent = '';

                  for (const block of messageContent) {
                    if (block?.type === 'text' && block?.text) {
                      fullContent += block.text;
                    } else if (block?.type === 'tool_use') {
                      addToolMessage(block?.name || 'unknown', block?.input ? Object.values(block.input) : []);
                    }
                  }

                  if (fullContent.trim()) {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      // Update last pending assistant message
                      for (let i = newMessages.length - 1; i >= 0; i--) {
                        const message = newMessages[i];
                        if (message && message.role === 'assistant' && message.status === 'pending') {
                          newMessages[i] = {
                            ...message,
                            content: fullContent,
                            status: 'complete' as const
                          };
                          break;
                        }
                      }
                      return newMessages;
                    });
                  }
                } else if (typeof messageContent === 'string') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    // Update last pending assistant message
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      const message = newMessages[i];
                      if (message && message.role === 'assistant' && message.status === 'pending') {
                        newMessages[i] = {
                          ...message,
                          content: messageContent,
                          status: 'complete' as const
                        };
                        break;
                      }
                    }
                    return newMessages;
                  });
                }

                setIsGenerating(false);
              }
            }
          } catch (error) {
            addMessage('system', `Error: ${error instanceof Error ? error.message : String(error)}`, 'complete');
            setIsGenerating(false);
          }
        });

        setChannel(channelStream);

        // Start git workflow
        await new Promise(resolve => setTimeout(resolve, 100));
        await client.startGitWorkflow(session.domainActor);

        setSetupStatus('ready');

      } catch (error) {
        setSetupStatus('error');
        const errorMessage = error instanceof Error ? error.message : String(error);
        setSetupMessage(`Error: ${errorMessage}`);
      }
    }

    setupChannel();
  }, [client, session, addMessage, addToolMessage, setupSteps]);

  // Send message function
  const sendMessage = useCallback(async (messageText: string) => {
    if (!channel || !messageText.trim()) return;

    try {
      setIsGenerating(true);

      // Add user message as pending
      addPendingMessage('user', messageText.trim());

      // Add pending assistant message
      addPendingMessage('assistant', '');

      // Send message through domain actor
      await client.sendMessage(session.domainActor, messageText.trim());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('system', `Error sending message: ${errorMessage}`, 'complete');
      setIsGenerating(false);
    }
  }, [channel, client, session, addPendingMessage, addMessage]);

  // Keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'c') {
      exit();
      return;
    } else if (key.ctrl && input.toLowerCase() === 'l') {
      setMessages([]);
      return;
    } else if (key.ctrl && input.toLowerCase() === 't') {
      setToolDisplayMode(prev =>
        prev === 'hidden' ? 'minimal' :
          prev === 'minimal' ? 'full' : 'hidden'
      );
      return;
    } else if (key.ctrl && input.toLowerCase() === 'h') {
      setShowHelp(prev => !prev);
      return;
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        try {
          channel.close();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [channel]);

  return (
    <Box flexDirection="column" height="100%">
      <GitHeader 
        repository={repository} 
        workflow={workflow} 
        setupStatus={setupStatus} 
        setupMessage={setupMessage} 
      />

      {showHelp && (
        <Box borderStyle="round" borderColor="blue" padding={1} marginBottom={1}>
          <Text color="cyan">
            💡 Shortcuts: Ctrl+C (exit), Ctrl+L (clear), Ctrl+T (tool display), Ctrl+H (toggle help)
          </Text>
        </Box>
      )}

      {setupStatus !== 'ready' ? (
        <Box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1}>
        </Box>
      ) : (
        <>
          <Box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1}>
            {messages.length === 0 ? (
              <Text color="gray" dimColor>
                ℹ️  git: Ready for {workflow} workflow. Type your questions or let me analyze the repository.
              </Text>
            ) : (
              messages.map((message, index) => (
                <MessageComponent key={index} message={message} toolDisplayMode={toolDisplayMode} />
              ))
            )}

            {isGenerating && (
              <Box marginBottom={1}>
                <Spinner type="dots" />
                <Text color="yellow"> Working on it...</Text>
              </Box>
            )}
          </Box>

          <Box paddingLeft={1} paddingRight={1} paddingBottom={1}>
            <MultiLineInput
              placeholder={isGenerating ? "Processing..." : "💬 "}
              onSubmit={sendMessage}
              disabled={isGenerating}
            />
          </Box>
        </>
      )}
    </Box>
  );
}

/**
 * Git-specific header component
 */
function GitHeader({ repository, workflow, setupStatus, setupMessage }: GitHeaderProps) {
  const workflowTitle = workflow.charAt(0).toUpperCase() + workflow.slice(1);
  const repoName = repository.path.split('/').pop() || 'Repository';

  // Show minimal header when ready
  if (setupStatus === 'ready') {
    return (
      <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
        <Box>
          <Text color="cyan">🎭 Git {workflowTitle} Assistant</Text>
        </Box>
        <Box>
          <Text color="gray">📁 {repoName}</Text>
          <Text color="gray"> • </Text>
          <Text color="gray">🌿 {repository.currentBranch}</Text>
          {repository.hasUncommittedChanges && (
            <>
              <Text color="gray"> • </Text>
              <Text color="yellow">⚠️  Changes pending</Text>
            </>
          )}
        </Box>
      </Box>
    );
  }

  // Show loading state
  return (
    <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
      <Box>
        <Text color="cyan">🎭 Git {workflowTitle} Assistant</Text>
      </Box>
      <Box>
        <Text color="gray">📁 {repoName} • 🌿 {repository.currentBranch}</Text>
      </Box>
      <Box>
        <Spinner type="dots" />
        <Text color="yellow"> {setupMessage}</Text>
      </Box>
    </Box>
  );
}

/**
 * Message component
 */
function MessageComponent({ message, toolDisplayMode }: MessageComponentProps) {
  const { role, content, status, toolName, toolArgs } = message;

  if (role === 'tool' && toolDisplayMode === 'hidden') {
    return null;
  }

  // Skip empty system messages
  if (role === 'system' && !content.trim()) {
    return null;
  }

  const contentColor = {
    user: 'gray',
    assistant: 'white',
    system: 'gray',
    tool: 'magenta'
  }[role] || 'white';

  const prefix = {
    user: '👤 You: ',
    assistant: '🤖 Assistant: ',
    system: 'ℹ️  git: ',
    tool: '🔧 '
  }[role] || '';

  // Handle tool messages
  if (role === 'tool') {
    if (toolDisplayMode === 'minimal') {
      const args = toolArgs ? toolArgs.join(' ') : '';
      return (
        <Box marginBottom={1}>
          <Text color="magenta" dimColor>
            {prefix}{toolName}: {args}
          </Text>
        </Box>
      );
    } else if (toolDisplayMode === 'full') {
      const args = toolArgs ? toolArgs.join(' ') : '';
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="magenta">
            {prefix}{toolName}
          </Text>
          <Text color="magenta" dimColor>
            Args: {args}
          </Text>
        </Box>
      );
    }
    return null;
  }

  // Handle regular messages
  const lines = content.split('\n');
  const hasMultipleLines = lines.length > 1;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {lines.map((line, index) => (
        <Text key={index} color={contentColor}>
          {index === 0 ? prefix : hasMultipleLines ? '   ' : ''}{line || ' '}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Render the Git Chat app
 */
export async function renderGitChatApp(
  client: GitTheaterClient,
  session: ChatSession,
  repository: GitRepository,
  workflow: GitWorkflow
): Promise<void> {
  let app: any = null;

  const cleanup = async () => {
    try {
      if (session && client) {
        await client.stopActor(session.domainActor);
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    if (app) {
      app.unmount();
    }
  };

  // Set up cleanup on exit
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    app = render(
      <GitChatApp
        client={client}
        session={session}
        repository={repository}
        workflow={workflow}
      />
    );

    await app.waitUntilExit();
  } catch (error) {
    console.error('App error:', error);
  } finally {
    cleanup();
  }
}
