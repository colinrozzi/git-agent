/**
 * Export all types for easy importing
 */

// Common types
export type {
  Message,
  SetupStatus,
  ToolDisplayMode,
  InputMode,
  UIVariant,
  ChatSession,
  ChannelStream,
  TheaterConfig
} from './common.js';

// UI-specific types
export type {
  MessageComponentProps,
  SimpleInputProps,
  MultiLineInputProps,
  SmartInputProps,
  StatusHeaderProps,

  HelpPanelProps,
  KeyboardShortcut,
  KeyboardShortcutsConfig
} from './ui.js';
