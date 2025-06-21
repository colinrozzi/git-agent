/**
 * Core types for terminal-chat-ui components
 */

// Simplified message structure - no more pending state management
export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  status: 'complete'; // Always complete - no more pending
  toolName?: string;
  toolArgs?: string[];
}

// Setup and connection states
export type SetupStatus = 'connecting' | 'opening_channel' | 'loading_actor' | 'ready' | 'error';

// Tool display configuration
export type ToolDisplayMode = 'hidden' | 'minimal' | 'full';

// Input modes for different editing experiences
export type InputMode = 'simple' | 'multiline' | 'auto';

// UI variants for different contexts
export type UIVariant = 'default' | 'git' | 'chat' | 'custom';

// Theater session information
export interface ChatSession {
  domainActor: any; // Actor from theater-client
  chatActorId: string;
}

// Channel stream interface (from theater-client)
export interface ChannelStream {
  channelId: string;
  onMessage(handler: (message: any) => void): () => void;
  sendMessage(message: string): Promise<void>;
  close(): void;
}

// Configuration for Theater connections
export interface TheaterConfig {
  server?: string;
  actor?: {
    manifest_path: string;
    initial_state?: any;
  };
  config?: any;
}
