/**
 * terminal-chat-ui - Shared UI components for terminal-based chat interfaces
 * 
 * A comprehensive library of React Ink components, hooks, and utilities
 * for building rich terminal chat interfaces with Theater actors.
 */

// Export all components
export {
  MessageComponent,
  StatusHeader,
  SimpleInput,
  MultiLineInput,
  SmartInput,
  HelpPanel
} from './components/index.js';

// Export all hooks
export {
  useKeyboardShortcuts,
  useMessageState,
  useTheaterSession,
  commonShortcuts
} from './hooks/index.js';

// Export all types
export type {
  Message,
  SetupStatus,
  ToolDisplayMode,
  InputMode,
  UIVariant,
  ChatSession,
  ChannelStream,
  TheaterConfig,
  MessageComponentProps,
  SimpleInputProps,
  MultiLineInputProps,
  SmartInputProps,
  StatusHeaderProps,

  HelpPanelProps,
  KeyboardShortcut,
  KeyboardShortcutsConfig
} from './types/index.js';

// Export all utilities
export {
  getMessagePrefixes,
  getMessageColor,
  formatMessageContent,
  extractToolInfo,
  filterMessages,
  validateTheaterConfig,
  getSetupStatusInfo,
  parseTheaterMessage,
  extractMessageContent,
  createDefaultTheaterConfig,
  generateActorId
} from './utils/index.js';

// Version info
export const version = '1.0.0';

// Re-export commonly used external dependencies for convenience
export { Box, Text, useInput, useApp, render } from 'ink';
// Note: React hooks should be imported directly from 'react' to avoid conflicts
