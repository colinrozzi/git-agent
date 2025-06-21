/**
 * useTheaterSession - centralized Theater connection and session management
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChannelStream, SetupStatus, TheaterConfig } from '../types/common.js';

/**
 * Hook for managing Theater actor sessions and channel communication
 */
export function useTheaterSession(client: any, config: TheaterConfig) {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('connecting');
  const [setupMessage, setSetupMessage] = useState<string>('Connecting to Theater...');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [channel, setChannel] = useState<ChannelStream | null>(null);

  // Setup status messages
  const setupSteps = {
    connecting: 'Connecting to Theater...',
    opening_channel: 'Opening communication channel...',
    loading_actor: 'Starting chat automation...',
    ready: 'Chat ready!'
  };

  // Setup the Theater session
  useEffect(() => {
    let mounted = true;

    async function setupSession() {
      try {
        if (!mounted) return;
        
        setSetupStatus('connecting');
        setSetupMessage(setupSteps.connecting);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!mounted) return;
        
        setSetupStatus('opening_channel');
        setSetupMessage(setupSteps.opening_channel);

        // This would be implemented by the specific client
        // The hook provides the structure, implementations provide the logic
        const newSession = await client.createSession?.(config);
        
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.chatActorId) {
          const channelStream = await client.openChannelStream?.(newSession.chatActorId);
          if (!mounted) return;
          setChannel(channelStream);
        }

        setSetupStatus('loading_actor');
        setSetupMessage(setupSteps.loading_actor);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!mounted) return;
        
        // Start the chat automation
        if (newSession?.domainActor) {
          await client.startChat?.(newSession.domainActor);
        }

        if (!mounted) return;
        setSetupStatus('ready');

      } catch (error) {
        if (!mounted) return;
        setSetupStatus('error');
        const errorMessage = error instanceof Error ? error.message : String(error);
        setSetupMessage(`Error: ${errorMessage}`);
      }
    }

    if (client) {
      setupSession();
    }

    return () => {
      mounted = false;
    };
  }, [client, config]);

  // Send message function
  const sendMessage = useCallback(async (message: string) => {
    if (!session?.domainActor || !client.sendMessage) {
      throw new Error('Session not ready');
    }
    
    return await client.sendMessage(session.domainActor, message);
  }, [session, client]);

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      if (channel) {
        channel.close();
      }
      if (session?.domainActor && client.stopActor) {
        await client.stopActor(session.domainActor);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }, [channel, session, client]);

  return {
    setupStatus,
    setupMessage,
    session,
    channel,
    sendMessage,
    cleanup,
    isReady: setupStatus === 'ready'
  };
}
