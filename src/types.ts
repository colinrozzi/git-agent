/**
 * Type definitions for git-agent
 */

// Re-export shared types from terminal-chat-ui
export type {
  Message,
  SetupStatus,
  ToolDisplayMode,
  ChatSession
} from 'terminal-chat-ui';

// Git-agent specific types
export type GitWorkflow = 'commit' | 'review' | 'rebase' | 'chat';
export type ExecutionMode = 'workflow' | 'interactive';

export interface GitAgentConfig {
  actor: {
    manifest_path: string;
    initial_state?: GitAssistantInitialState;
  };
  mode: ExecutionMode;
}

export interface GitAssistantInitialState {
  current_directory: string;
  task?: GitWorkflow;
  temperature?: number;
  max_tokens?: number;
  title?: string;
  description?: string;
  auto_exit_on_completion?: boolean;
  model_config?: {
    model: string;
    provider: string;
  };
}

export interface GitRepository {
  path: string;
  isClean: boolean;
  currentBranch: string;
  hasUncommittedChanges: boolean;
  modifiedFiles: string[];
  untrackedFiles: string[];
  stagedFiles: string[];
}

export interface CLIOptions {
  directory?: string;
  server?: string;
  mode?: ExecutionMode;
  verbose?: boolean;
  help?: boolean;
}
