/**
 * useMessageState - centralized message state management
 */

import { useState, useCallback } from 'react';
import type { Message } from '../types/common.js';

/**
 * Hook for managing message state in Theater chat interfaces
 */
export function useMessageState() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Add a new message
  const addMessage = useCallback((
    role: Message['role'], 
    content: string, 
    status: Message['status'] = 'complete',
    toolName?: string,
    toolArgs?: string[]
  ) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: new Date(),
      status,
      ...(toolName && { toolName }),
      ...(toolArgs && { toolArgs })
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Add a pending message (for loading states)
  const addPendingMessage = useCallback((role: Message['role'], content: string) => {
    addMessage(role, content, 'pending');
  }, [addMessage]);

  // Update the last pending message (useful for streaming responses)
  const updateLastPendingMessage = useCallback((content: string, status: Message['status'] = 'complete') => {
    setMessages(prev => {
      const newMessages = [...prev];
      // Find the last pending message and update it
      for (let i = newMessages.length - 1; i >= 0; i--) {
        const message = newMessages[i];
        if (message && message.status === 'pending') {
          newMessages[i] = {
            ...message,
            content,
            status
          };
          break;
        }
      }
      return newMessages;
    });
  }, []);

  // Add a tool message (insert before last assistant message)
  const addToolMessage = useCallback((toolName: string, toolArgs: string[] = []) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const toolMessage: Message = {
        role: 'tool',
        content: '',
        timestamp: new Date(),
        status: 'complete',
        toolName,
        toolArgs
      };

      // Insert tool message before last assistant message
      const lastAssistantIndex = newMessages.map(m => m.role).lastIndexOf('assistant');
      if (lastAssistantIndex !== -1) {
        newMessages.splice(lastAssistantIndex, 0, toolMessage);
        return newMessages;
      } else {
        return [...prev, toolMessage];
      }
    });
  }, []);

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
    addPendingMessage,
    updateLastPendingMessage,
    addToolMessage,
    clearMessages,
    removeMessage,
    setMessages
  };
}
