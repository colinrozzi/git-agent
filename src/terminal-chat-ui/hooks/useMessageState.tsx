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
    console.log('📝 [useMessageState] Updating pending message:', content.substring(0, 50) + '...', 'status:', status);
    setMessages(prev => {
      const newMessages = [...prev];
      // Find the last pending message and update it
      for (let i = newMessages.length - 1; i >= 0; i--) {
        const message = newMessages[i];
        if (message && message.status === 'pending') {
          console.log('🎯 [useMessageState] Found pending message at index:', i, 'updating content');
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

  // Add a tool message (insert before the last pending assistant message)
  const addToolMessage = useCallback((toolName: string, toolArgs: string[] = []) => {
    console.log('🔧 [useMessageState] Adding tool message:', toolName, toolArgs);
    setMessages(prev => {
      const newMessages = [...prev];
      console.log('📊 [useMessageState] Current messages before tool add:', newMessages.length);
      
      const toolMessage: Message = {
        role: 'tool',
        content: '',
        timestamp: new Date(),
        status: 'complete',
        toolName,
        toolArgs
      };

      // Find the last pending assistant message and insert tool before it
      let insertIndex = newMessages.length;
      for (let i = newMessages.length - 1; i >= 0; i--) {
        const message = newMessages[i];
        if (message.role === 'assistant' && message.status === 'pending') {
          insertIndex = i;
          console.log('🎯 [useMessageState] Found pending assistant at index:', i, '- inserting tool before it');
          break;
        }
      }
      
      console.log('📋 [useMessageState] Inserting tool message at index:', insertIndex);
      newMessages.splice(insertIndex, 0, toolMessage);
      console.log('📊 [useMessageState] Messages after tool add:', newMessages.length);
      return newMessages;
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
