/**
 * useMessageState - simplified message state management
 */

import { useState, useCallback } from 'react';
import type { Message } from '../types/common.js';

/**
 * Simplified hook for managing message state in Theater chat interfaces
 */
export function useMessageState() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Add a new message - simple append
  const addMessage = useCallback((
    role: Message['role'],
    content: string,
    toolName?: string,
    toolArgs?: string[]
  ) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: new Date(),
      status: 'complete', // All messages are complete when added
      ...(toolName && { toolName }),
      ...(toolArgs && { toolArgs })
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Add a tool message
  const addToolMessage = useCallback((toolName: string, toolArgs: string[] = []) => {
    addMessage('tool', '', toolName, toolArgs);
  }, [addMessage]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Remove a specific message
  const removeMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    messages,
    addMessage,
    addToolMessage,
    clearMessages,
    removeMessage,
    setMessages
  };
}
