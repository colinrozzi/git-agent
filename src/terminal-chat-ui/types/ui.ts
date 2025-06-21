/**
 * UI-specific types for terminal-chat-ui components
 */

import type { ComponentType } from 'react';
import type { Message, ToolDisplayMode, InputMode, UIVariant, SetupStatus } from './common.js';

// Props for message components
export interface MessageComponentProps {
  message: Message;
  toolDisplayMode: ToolDisplayMode;
  variant?: UIVariant;
  prefixOverrides?: Record<string, string>;
  contentColor?: string;
  showTimestamp?: boolean;
}

// Props for input components
export interface SimpleInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export interface MultiLineInputProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  maxHeight?: number;
  mode?: 'insert' | 'command';
  onModeChange?: (mode: 'insert' | 'command') => void;
  content?: string;
  cursorPosition?: number;
  onContentChange?: (content: string) => void;
  onCursorChange?: (position: number) => void;
  disabled?: boolean;
}

export interface SmartInputProps {
  mode?: InputMode;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoMultilineThreshold?: number;
  maxHeight?: number;
}

// Props for status and header components
export interface StatusHeaderProps {
  title: string;
  subtitle?: string;
  setupStatus: SetupStatus;
  setupMessage?: string;
  variant?: UIVariant;
  showSpinner?: boolean;
  SpinnerComponent?: ComponentType<any>;
}

// LoadingSpinnerProps removed - use Spinner directly from ink-spinner

// Props for help and utility components
export interface HelpPanelProps {
  shortcuts?: Array<{
    key: string;
    description: string;
  }>;
  variant?: UIVariant;
  borderColor?: string;
}

// Keyboard shortcut configuration
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  disabled?: boolean;
}
