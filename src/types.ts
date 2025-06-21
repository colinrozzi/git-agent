/**
 * Type definitions for git-theater
 */

// Re-export shared types from terminal-chat-ui
export type {
  Message,
  SetupStatus,
  ToolDisplayMode,
  ChatSession
} from './terminal-chat-ui/index.js';

// Git-theater specific types
export type GitWorkflow = 'commit' | 'review' | 'rebase' | 'chat';

export interface GitTheaterConfig {
  actor: {
    manifest_path: string;
    initial_state?: GitAssistantInitialState;
  };
}

export interface GitAssistantInitialState {
  current_directory: string;
  workflow?: GitWorkflow;
  temperature?: number;
  max_tokens?: number;
  title?: string;
  description?: string;
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
  verbose?: boolean;
  help?: boolean;
}