/**
 * useKeyboardShortcuts - centralized keyboard shortcut handling
 */

import { useInput } from 'ink';
import type { KeyboardShortcutsConfig } from '../types/ui.js';

/**
 * Hook for managing keyboard shortcuts in terminal chat interfaces
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const { shortcuts, disabled = false } = config;

  useInput((input: string, key: any) => {
    if (disabled) return;

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === input.toLowerCase();
      const ctrlMatches = shortcut.ctrl ? key.ctrl : !key.ctrl;
      const metaMatches = shortcut.meta ? key.meta : !key.meta;
      
      return keyMatches && ctrlMatches && metaMatches;
    });

    if (matchingShortcut) {
      matchingShortcut.action();
    }
  });
}

/**
 * Common keyboard shortcuts for Theater chat interfaces
 */
export const commonShortcuts = {
  exit: (exitFn: () => void) => ({
    key: 'c',
    ctrl: true,
    description: 'Exit application',
    action: exitFn
  }),
  
  clear: (clearFn: () => void) => ({
    key: 'l',
    ctrl: true,
    description: 'Clear message history',
    action: clearFn
  }),
  
  toggleTools: (toggleFn: () => void) => ({
    key: 't',
    ctrl: true,
    description: 'Toggle tool display',
    action: toggleFn
  }),
  
  toggleHelp: (toggleFn: () => void) => ({
    key: 'h',
    ctrl: true,
    description: 'Toggle help',
    action: toggleFn
  })
};
