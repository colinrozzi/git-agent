/**
 * Git-focused chat UI component - simplified version
 */

import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useEffect, useCallback } from 'react';
import {
  MessageComponent,
  SmartInput,
  HelpPanel,
  useMessageState,
  useKeyboardShortcuts,
  commonShortcuts,
  type ToolDisplayMode,
  type SetupStatus
} from '../terminal-chat-ui/index.js';

import type { GitRepository, GitWorkflow, ChatSession, ExecutionMode } from '../types.js';
import type { GitTheaterClient } from '../theater-client.js';
import type { ChannelStream } from 'theater-client';

interface GitChatAppProps {
  client: GitTheaterClient;
  session: ChatSession;
  repoPath: string;
  workflow: GitWorkflow;
  mode: ExecutionMode;
}

/**
 * Hook for graceful exit with actor cleanup
 */
function useGracefulExit(client: GitTheaterClient, session: ChatSession) {
  return useCallback(async (exitCode: number = 0) => {
    try {
      await client.stopActor(session.domainActor);
    } catch (error) {
      // Ignore cleanup errors on exit
    }
    process.exit(exitCode);
  }, [client, session]);
}

/**
 * Simple loading indicator component
 */
function LoadingIndicator() {
  return (
    <Box paddingLeft={1} marginBottom={1}>
      <Text color="gray">Assistant: </Text>
      <Spinner type="dots" />
      <Text color="gray" dimColor> thinking...</Text>
    </Box>
  );
}

/**
 * Main Git Chat application with simplified message handling
 */
function GitChatApp({ client, session, repoPath, workflow, mode }: GitChatAppProps) {
  const [workflowCompleted, setWorkflowCompleted] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<ExecutionMode>(mode);
  const gracefulExit = useGracefulExit(client, session);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [channel, setChannel] = useState<ChannelStream | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('connecting');
  const [setupMessage, setSetupMessage] = useState<string>('Connecting to Theater...');
  const [toolDisplayMode, setToolDisplayMode] = useState<ToolDisplayMode>('minimal');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Use simplified message state management
  const {
    messages,
    addMessage,
    addToolMessage,
    clearMessages
  } = useMessageState();

  // Setup channel communication
  useEffect(() => {
    async function setupChannel() {
      try {
        setSetupStatus('connecting');
        setSetupMessage('Connecting to Theater...');
        //await new Promise(resolve => setTimeout(resolve, 500));

        setSetupStatus('opening_channel');
        setSetupMessage('Opening communication channel...');

        const channelStream = await client.openChannelStream(session.chatActorId);

        setSetupStatus('loading_actor');
        setSetupMessage(`Starting ${workflow} workflow...`);
        //await new Promise(resolve => setTimeout(resolve, 1000));

        // Set up simplified message handler
        channelStream.onMessage((message) => {
          try {
            const messageText = Buffer.from(message.data).toString('utf8');
            const parsedMessage = JSON.parse(messageText);

            if (parsedMessage.type === 'chat_message' && parsedMessage.message) {
              const messageEntry = parsedMessage?.message?.entry;
              const isUserMessage = messageEntry?.Message?.role === 'user';

              // Only process assistant messages
              if (!isUserMessage) {
                const messageContent = messageEntry?.Message?.content || messageEntry?.Completion?.content;
                const stopReason = messageEntry?.Message?.stop_reason || messageEntry?.Completion?.stop_reason;

                if (Array.isArray(messageContent)) {
                  let textContent = '';

                  // Process all content blocks
                  for (const block of messageContent) {
                    if (block?.type === 'text' && block?.text) {
                      textContent += block.text;

                      // Add text content as a regular message if we have any
                      if (textContent.trim()) {
                        addMessage('assistant', textContent);
                      }
                    } else if (block?.type === 'tool_use') {
                      // Add tool message immediately
                      addToolMessage(block?.name || 'unknown',
                        block?.input ? Object.values(block.input) : []);
                    }
                  }
                } else if (typeof messageContent === 'string' && messageContent.trim()) {
                  // Add string content as a regular message
                  addMessage('assistant', messageContent);
                }

                // Check if we're done generating
                if (stopReason === 'end_turn') {
                  setIsGenerating(false);
                }
              } else {
                // Add user message directly
                //console.log('User message received:', messageEntry?.Message?.content);
                //console.log('User message text:', messageEntry?.Message?.content[0]?.text);
                addMessage('user', messageEntry?.Message?.content[0]?.text || '');
              }
            }
          } catch (error) {
            addMessage('system', `Error: ${error instanceof Error ? error.message : String(error)}`);
            setIsGenerating(false);
          }
        });

        setChannel(channelStream);

        // Start git workflow
        //setIsGenerating(true);
        if (mode === 'workflow') {
          setIsGenerating(true);
        }
        await client.startGitWorkflow(session.domainActor);

        setSetupStatus('ready');

      } catch (error) {
        setSetupStatus('error');
        const errorMessage = error instanceof Error ? error.message : String(error);
        setSetupMessage(`Error: ${errorMessage}`);
        setIsGenerating(false);
      }
    }

    setupChannel();
  }, [client, session, workflow, addMessage, addToolMessage]);

  // Send message function
  const sendMessage = useCallback(async (messageText: string) => {
    if (!channel || !messageText.trim() || isGenerating) return;

    try {
      setIsGenerating(true);

      // Send message through domain actor (user message will be added via channel stream)
      await client.sendMessage(session.domainActor, messageText.trim());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('system', `Error sending message: ${errorMessage}`);
      setIsGenerating(false);
    }
  }, [channel, client, session, addMessage, isGenerating]);

  // Auto-exit logic for workflow mode
  useEffect(() => {
    if (workflowCompleted && currentMode === 'workflow') {
      gracefulExit(0);
    }
  }, [workflowCompleted, currentMode, gracefulExit]);

  // Workflow completion detection
  useEffect(() => {
    if (currentMode === 'workflow' && !isGenerating && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && !isGenerating) {
        // Delay to show final message, then auto-exit
        setWorkflowCompleted(true);
      }
    }
  }, [isGenerating, messages, currentMode]);

  // Use keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      commonShortcuts.exit(() => gracefulExit(0)),
      commonShortcuts.clear(clearMessages),
      commonShortcuts.toggleHelp(() => setShowHelp(!showHelp)),
      {
        key: 'i',
        description: 'Switch to interactive mode',
        action: () => {
          if (currentMode === 'workflow') {
            setCurrentMode('interactive');
          }
        }
      },
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

  return (
    <Box flexDirection="column" height="100%" width="100%">
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
        <Box flexDirection="column" flexGrow={1} width="100%" justifyContent="center" alignItems="flex-start">
          <Box paddingLeft={1}>
            <Spinner type="dots" />
            <Text color="cyan"> {setupMessage}</Text>
          </Box>
        </Box>
      ) : (
        <>
          <Box flexDirection="column" width="100%" paddingLeft={1} paddingRight={1}>
            {messages.length === 0 && !isGenerating ? (
              <Text color="gray" dimColor>
                [git] Ready for {workflow} workflow. Type your questions or let me analyze the repository.
              </Text>
            ) : (
              <>
                {/* Render all messages */}
                {messages.map((message, index) => (
                  <MessageComponent
                    key={index}
                    message={message}
                    toolDisplayMode={toolDisplayMode}
                    variant="git"
                    prefixOverrides={{
                      user: '',
                      assistant: '',
                      system: '[git] ',
                      tool: '[tool] '
                    }}
                  />
                ))}

                {/* Show loading indicator when generating */}
                {isGenerating && <LoadingIndicator />}
              </>
            )}
          </Box>

          {/* Conditional input rendering based on mode */}
          {(currentMode === 'interactive' || showHelp) && (
            <Box width="100%" paddingLeft={1} paddingRight={1} paddingBottom={1}>
              <Box width="100%">
                <SmartInput
                  placeholder={isGenerating ? "Processing..." : "Message: "}
                  onSubmit={sendMessage}
                  disabled={isGenerating}
                  mode="auto"
                  autoMultilineThreshold={50}
                />
              </Box>
            </Box>
          )}

          {/* Mode indicators */}
          {currentMode === 'workflow' && !workflowCompleted && (
            <Box paddingLeft={1} paddingY={1}>
              <Text color="gray" dimColor>
                {workflow} workflow mode • Press 'i' to enter interactive chat
              </Text>
            </Box>
          )}

          {currentMode === 'interactive' && (
            <Box paddingLeft={1} paddingY={1}>
              <Text color="green" dimColor>
                Interactive mode • Chat with git assistant
              </Text>
            </Box>
          )}

          {currentMode === 'workflow' && workflowCompleted && (
            <Box paddingLeft={1} paddingY={1}>
              <Text color="green">
                ✓ Workflow complete • Cleaning up...
              </Text>
            </Box>
          )}
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
  repoPath: string,
  workflow: GitWorkflow,
  mode: ExecutionMode
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
        repoPath={repoPath}
        workflow={workflow}
        mode={mode}
      />
    );

    await app.waitUntilExit();
  } catch (error) {
    console.error('App error:', error);
  } finally {
    cleanup();
  }
}
