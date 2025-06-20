/**
 * Type definitions for git-theater
 */

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

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  status: 'pending' | 'complete';
  toolName?: string;
  toolArgs?: string[];
}

export type SetupStatus = 'connecting' | 'opening_channel' | 'loading_actor' | 'ready' | 'error';

export type ToolDisplayMode = 'hidden' | 'minimal' | 'full';

export interface CLIOptions {
  directory?: string;
  server?: string;
  verbose?: boolean;
  help?: boolean;
}

export interface ChatSession {
  domainActor: any; // Actor from theater-client
  chatActorId: string;
}