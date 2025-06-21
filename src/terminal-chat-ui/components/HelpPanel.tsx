/**
 * HelpPanel - displays keyboard shortcuts and help information
 */

import { Box, Text } from 'ink';
import type { HelpPanelProps } from '../types/ui.js';

/**
 * Help panel component that displays keyboard shortcuts and usage information
 */
export function HelpPanel({ 
  shortcuts = [], 
  variant = 'default',
  borderColor = 'blue'
}: HelpPanelProps) {
  
  // Default shortcuts if none provided
  const defaultShortcuts = [
    { key: 'Ctrl+C', description: 'Exit application' },
    { key: 'Ctrl+L', description: 'Clear message history' },
    { key: 'Ctrl+T', description: 'Toggle tool display' },
    { key: 'Ctrl+H', description: 'Toggle help' },
    { key: 'Enter', description: 'Send message' },
  ];

  const displayShortcuts = shortcuts.length > 0 ? shortcuts : defaultShortcuts;

  // Add variant-specific shortcuts
  const variantShortcuts = {
    git: [
      { key: 'commit', description: 'Start commit workflow' },
      { key: 'review', description: 'Start code review' },
      { key: 'rebase', description: 'Interactive rebase helper' }
    ],
    chat: [
      { key: 'Ctrl+Return', description: 'Send message (multiline mode)' },
      { key: 'Esc', description: 'Switch to command mode' }
    ]
  };

  const allShortcuts = [
    ...displayShortcuts,
    ...(variantShortcuts[variant as keyof typeof variantShortcuts] || [])
  ];

  return (
    <Box 
      borderStyle="round" 
      borderColor={borderColor} 
      padding={1} 
      marginBottom={1}
      flexDirection="column"
    >
      <Text color="cyan" bold>
        💡 Keyboard Shortcuts
      </Text>
      
      <Box flexDirection="column" marginTop={1}>
        {allShortcuts.map((shortcut, index) => (
          <Box key={index} justifyContent="space-between" minWidth={50}>
            <Text color="yellow">{shortcut.key}</Text>
            <Text color="gray">{shortcut.description}</Text>
          </Box>
        ))}
      </Box>
      
      {variant === 'git' && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            💡 Tip: Use workflow commands from any git repository
          </Text>
        </Box>
      )}
    </Box>
  );
}
