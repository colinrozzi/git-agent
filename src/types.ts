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
export type ExecutionMode = 'task' | 'interactive';

export interface GitAgentConfig {
  actor: {
    manifest_path: string;
    initial_state?: TaskManagerInitialState;
  };
  mode: ExecutionMode;
}

export interface TaskManagerInitialState {
  // Core task definition
  system_prompt?: string;
  initial_message?: string;

  // AI configuration  
  model_config?: {
    model: string;
    provider: string;
  };
  temperature?: number;
  max_tokens?: number;

  // Tool configuration
  mcp_servers?: Array<{
    actor_id?: string | null;
    actor?: {
      manifest_path: string;
      init_state?: any;
    };
    tools?: any;
  }>;

  // Execution mode
  auto_exit_on_completion?: boolean;
}

// Legacy type alias for compatibility
export interface GitAssistantInitialState extends TaskManagerInitialState {
  current_directory?: string;
  task?: GitWorkflow;
  title?: string;
  description?: string;
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
