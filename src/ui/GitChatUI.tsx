/**
 * Git-focused chat UI component using terminal-chat-ui
 */

import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useEffect, useCallback } from 'react';
import {
  MessageComponent,
  StatusHeader,
  SmartInput,
  HelpPanel,
  useMessageState,
  useKeyboardShortcuts,
  commonShortcuts,
  type ToolDisplayMode,
  type SetupStatus
} from '../terminal-chat-ui/index.js';

import type { GitRepository, GitWorkflow, ChatSession } from '../types.js';
import type { GitTheaterClient } from '../theater-client.js';
import type { ChannelStream } from 'theater-client';

interface GitChatAppProps {
  client: GitTheaterClient;
  session: ChatSession;
  repository: GitRepository;
  workflow: GitWorkflow;
}

/**
 * Main Git Chat application using terminal-chat-ui components
 */
function GitChatApp({ client, session, repository, workflow }: GitChatAppProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [channel, setChannel] = useState<ChannelStream | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('connecting');
  const [setupMessage, setSetupMessage] = useState<string>('Connecting to Theater...');
  const [toolDisplayMode, setToolDisplayMode] = useState<ToolDisplayMode>('minimal');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Use terminal-chat-ui message state management
  const {
    messages,
    addMessage,
    addPendingMessage,
    updateLastPendingMessage,
    addToolMessage,
    clearMessages
  } = useMessageState();

  // Setup channel communication
  useEffect(() => {
    async function setupChannel() {
      try {
        setSetupStatus('connecting');
        setSetupMessage('Connecting to Theater...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setSetupStatus('opening_channel');
        setSetupMessage('Opening communication channel...');

        const channelStream = await client.openChannelStream(session.chatActorId);

        setSetupStatus('loading_actor');
        setSetupMessage(`Starting ${workflow} workflow...`);
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
                      // Handle tool messages using terminal-chat-ui
                      addToolMessage(
                        block?.name || 'unknown',
                        block?.input ? Object.values(block.input) : []
                      );
                    }
                  }

                  if (fullContent.trim()) {
                    // Debug: Log what we're trying to update
                    console.log('DEBUG: Assistant text:', fullContent.substring(0, 100) + '...');
                    updateLastPendingMessage(fullContent);
                  }
                } else if (typeof messageContent === 'string') {
                  // Debug: Log string content
                  console.log('DEBUG: String content:', messageContent.substring(0, 100) + '...');
                  updateLastPendingMessage(messageContent);
                }

                setIsGenerating(false);
              }
            }
          } catch (error) {
            addMessage('system', `Error: ${error instanceof Error ? error.message : String(error)}`);
            setIsGenerating(false);
          }
        });

        setChannel(channelStream);

        // Start git workflow - add pending assistant message first
        addPendingMessage('assistant', '');
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
  }, [client, session, workflow, addMessage, addToolMessage, updateLastPendingMessage]);

  // Send message function
  const sendMessage = useCallback(async (messageText: string) => {
    if (!channel || !messageText.trim()) return;

    try {
      setIsGenerating(true);

      // Add user message
      addMessage('user', messageText.trim());

      // Add pending assistant message
      addPendingMessage('assistant', '');

      // Send message through domain actor
      await client.sendMessage(session.domainActor, messageText.trim());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('system', `Error sending message: ${errorMessage}`);
      setIsGenerating(false);
    }
  }, [channel, client, session, addMessage, addPendingMessage]);

  // Use terminal-chat-ui keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      commonShortcuts.exit(() => process.exit(0)),
      commonShortcuts.clear(clearMessages),
      commonShortcuts.toggleHelp(() => setShowHelp(!showHelp)),
      {
        key: 't',
        ctrl: true,
        description: 'Toggle tool display',
        action: () => setToolDisplayMode(prev =>
          prev === 'hidden' ? 'minimal' :
            prev === 'minimal' ? 'full' : 'hidden'
        )
      }
    ]
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

  // Create git-specific header content
  const workflowTitle = workflow.charAt(0).toUpperCase() + workflow.slice(1);
  const repoName = repository.path.split('/').pop() || 'Repository';
  const title = `Git ${workflowTitle} Assistant`;
  const subtitle = `${repoName} • ${repository.currentBranch}${repository.hasUncommittedChanges ? ' • Changes pending' : ''}`;

  return (
    <Box flexDirection="column" height="100%">
      <StatusHeader
        title={title}
        subtitle={subtitle}
        setupStatus={setupStatus}
        setupMessage={setupMessage}
        variant="git"
      />

      {showHelp && (
        <HelpPanel
          shortcuts={[
            { key: 'Ctrl+C', description: 'Exit' },
            { key: 'Ctrl+L', description: 'Clear messages' },
            { key: 'Ctrl+T', description: 'Toggle tool display' },
            { key: 'Ctrl+H', description: 'Toggle help' }
          ]}
          variant="git"
        />
      )}

      {setupStatus !== 'ready' ? (
        <Box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1}>
          {/* StatusHeader shows the setup status, so we don't need extra content here */}
        </Box>
      ) : (
        <>
          <Box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1}>
            {messages.length === 0 ? (
              <Text color="gray" dimColor>
                [git] Ready for {workflow} workflow. Type your questions or let me analyze the repository.
              </Text>
            ) : (
              messages.map((message, index) => (
                <MessageComponent
                  key={index}
                  message={message}
                  toolDisplayMode={toolDisplayMode}
                  variant="git"
                  prefixOverrides={{
                    user: 'You: ',
                    assistant: 'Assistant: ',
                    system: '[git] ',
                    tool: '[tool] '
                  }}
                />
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
            <SmartInput
              placeholder={isGenerating ? "Processing..." : "Message: "}
              onSubmit={sendMessage}
              disabled={isGenerating}
              mode="auto"
              autoMultilineThreshold={50}
            />
          </Box>
        </>
      )}
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
