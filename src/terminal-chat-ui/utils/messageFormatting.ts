/**
 * Message formatting utilities
 */

import type { Message, UIVariant } from '../types/common.js';

/**
 * Get default message prefixes based on UI variant
 */
export function getMessagePrefixes(variant: UIVariant = 'default') {
  const base = {
    user: '👤 You: ',
    assistant: 'Assistant: ',
    system: 'ℹ️  system: ',
    tool: '[tool] '
  };

  switch (variant) {
    case 'git':
      return { ...base, system: '[git] ', assistant: 'Git Assistant: ' };
    case 'chat':
      return { ...base, assistant: 'Chat: ' };
    default:
      return base;
  }
}

/**
 * Get content color for message role
 */
export function getMessageColor(role: Message['role'], variant: UIVariant = 'default') {
  const colors = {
    user: 'gray',
    assistant: 'white',
    system: 'gray',
    tool: 'magenta'
  };

  return colors[role] || 'white';
}

/**
 * Format message content for display
 */
export function formatMessageContent(content: string, maxLineLength?: number): string {
  if (!maxLineLength) return content;
  
  return content
    .split('\n')
    .map(line => {
      if (line.length <= maxLineLength) return line;
      
      // Simple word wrapping
      const words = line.split(' ');
      const wrappedLines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + ' ' + word).length <= maxLineLength) {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
          if (currentLine) wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      
      if (currentLine) wrappedLines.push(currentLine);
      return wrappedLines.join('\n');
    })
    .join('\n');
}

/**
 * Extract tool information from message content
 */
export function extractToolInfo(content: string): { toolName?: string; toolArgs?: string[] } {
  // Simple tool detection - could be enhanced based on message format
  const toolPattern = /\[tool\]\s*(\w+)(?::\s*(.+))?/;
  const match = content.match(toolPattern);
  
  if (match) {
    const [, toolName, argsString] = match;
    const toolArgs = argsString ? argsString.split(/\s+/) : [];
    return { toolName, toolArgs };
  }
  
  return {};
}

/**
 * Filter messages based on criteria
 */
export function filterMessages(
  messages: Message[], 
  criteria: {
    role?: Message['role'];
    status?: Message['status'];
    hideEmpty?: boolean;
    hideSystem?: boolean;
  }
): Message[] {
  return messages.filter(message => {
    if (criteria.role && message.role !== criteria.role) return false;
    if (criteria.status && message.status !== criteria.status) return false;
    if (criteria.hideEmpty && !message.content.trim()) return false;
    if (criteria.hideSystem && message.role === 'system') return false;
    return true;
  });
}
