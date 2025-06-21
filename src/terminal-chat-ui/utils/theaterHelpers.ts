/**
 * Theater-specific utility functions
 */

import type { TheaterConfig, SetupStatus } from '../types/common.js';

/**
 * Validate Theater configuration
 */
export function validateTheaterConfig(config: TheaterConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.server && !config.actor?.manifest_path) {
    errors.push('Either server address or actor manifest path is required');
  }

  if (config.actor?.manifest_path && !config.actor.manifest_path.endsWith('.toml')) {
    errors.push('Actor manifest path should point to a .toml file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get setup status display information
 */
export function getSetupStatusInfo(status: SetupStatus) {
  const statusInfo = {
    connecting: {
      message: 'Connecting to Theater...',
      color: 'yellow',
      showSpinner: true
    },
    opening_channel: {
      message: 'Opening communication channel...',
      color: 'yellow',
      showSpinner: true
    },
    loading_actor: {
      message: 'Starting chat automation...',
      color: 'yellow',
      showSpinner: true
    },
    ready: {
      message: 'Chat ready!',
      color: 'green',
      showSpinner: false
    },
    error: {
      message: 'Connection failed',
      color: 'red',
      showSpinner: false
    }
  };

  return statusInfo[status];
}

/**
 * Parse Theater message from WebSocket
 */
export function parseTheaterMessage(rawMessage: any) {
  try {
    if (typeof rawMessage.data === 'string') {
      return JSON.parse(rawMessage.data);
    } else if (rawMessage.data instanceof Uint8Array) {
      const messageText = new TextDecoder().decode(rawMessage.data);
      return JSON.parse(messageText);
    } else if (Buffer.isBuffer(rawMessage.data)) {
      const messageText = rawMessage.data.toString('utf8');
      return JSON.parse(messageText);
    } else {
      return rawMessage.data;
    }
  } catch (error) {
    console.error('Failed to parse Theater message:', error);
    return null;
  }
}

/**
 * Extract message content from Theater message format
 */
export function extractMessageContent(parsedMessage: any): {
  content: string;
  isUserMessage: boolean;
  toolBlocks: Array<{ name: string; input: any }>;
} {
  const messageEntry = parsedMessage?.message?.entry;
  const isUserMessage = messageEntry?.Message?.role === 'user';
  const messageContent = messageEntry?.Message?.content || messageEntry?.Completion?.content;
  
  let content = '';
  const toolBlocks: Array<{ name: string; input: any }> = [];

  if (Array.isArray(messageContent)) {
    // Handle structured content (array of content blocks)
    for (const block of messageContent) {
      if (block?.type === 'text' && block?.text) {
        content += block.text;
      } else if (block?.type === 'tool_use') {
        toolBlocks.push({
          name: block?.name || 'unknown',
          input: block?.input || {}
        });
      }
    }
  } else if (typeof messageContent === 'string') {
    content = messageContent;
  }

  return {
    content: content.trim(),
    isUserMessage,
    toolBlocks
  };
}

/**
 * Create default Theater configuration
 */
export function createDefaultTheaterConfig(overrides: Partial<TheaterConfig> = {}): TheaterConfig {
  return {
    server: '127.0.0.1:9000',
    ...overrides
  };
}

/**
 * Generate unique actor ID
 */
export function generateActorId(prefix: string = 'actor'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}
