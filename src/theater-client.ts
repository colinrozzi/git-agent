/**
 * Theater client wrapper for git workflows
 */

import { TheaterClient, Actor, ChannelStream, setLogLevel } from 'theater-client';
import type { GitTheaterConfig, ChatSession } from './types.js';

// New type for actor lifecycle callbacks
export interface ActorLifecycleCallbacks {
  onActorExit?: (result: any) => void;
  onActorError?: (error: any) => void;
  onActorEvent?: (event: any) => void;
}

export class GitTheaterClient {
  private client: TheaterClient;

  constructor(serverAddress: string, verbose: boolean = false) {
    if (verbose) {
      setLogLevel('info');
    } else {
      setLogLevel('error');
    }

    const [host, port] = serverAddress.split(':');
    this.client = new TheaterClient(
      host || '127.0.0.1',
      parseInt(port || '9000') || 9000,
      {
        timeout: 0, // No timeout for interactive chat sessions
        retryAttempts: 3,
        retryDelay: 1000
      }
    );
  }

  /**
   * Start a domain actor with lifecycle callbacks
   */
  async startDomainActor(
    manifestPath: string,
    initialState: any = {},
    callbacks?: ActorLifecycleCallbacks
  ): Promise<Actor> {
    const actor = await this.client.startActor({
      manifest: manifestPath,
      initialState: new TextEncoder().encode(JSON.stringify(initialState)),
      onEvent: (event) => {
        // Call user-provided event callback if provided
        if (callbacks?.onActorEvent) {
          callbacks.onActorEvent(event);
        }
        // You can also log events if verbose mode is enabled
        // console.log(`Domain actor event: ${JSON.stringify(event)}`);
      },
      onError: (error) => {
        //console.error(`Domain actor error: ${error instanceof Error ? error.message : String(error)}`);

        // Call user-provided error callback
        if (callbacks?.onActorError) {
          callbacks.onActorError(error);
        }
      },
      onActorResult: (result) => {
        // This gets called when the actor exits/completes
        //console.log(`Domain actor exited with result: ${JSON.stringify(result)}`);

        // Call user-provided exit callback
        if (callbacks?.onActorExit) {
          callbacks.onActorExit(result);
        }
      }
    });

    return actor;
  }

  /**
   * Get the chat state actor ID from a domain actor
   */
  async getChatStateActorId(domainActor: Actor): Promise<string> {
    const response = await domainActor.requestJson({
      type: 'GetChatStateActorId'
    });

    if (response.type !== 'ChatStateActorId' || !response.actor_id) {
      throw new Error(`Invalid response from git-chat-assistant: ${JSON.stringify(response)}`);
    }

    return response.actor_id;
  }

  /**
   * Start a git workflow session with lifecycle callbacks
   */
  async startGitSession(config: GitTheaterConfig, callbacks?: ActorLifecycleCallbacks): Promise<ChatSession> {
    // Start git-chat-assistant domain actor
    const domainActor = await this.client.startActor({
      manifest: config.actor.manifest_path,
      initialState: new TextEncoder().encode(JSON.stringify(config.actor.initial_state)),
      onEvent: (event) => {
        if (callbacks?.onActorEvent) {
          callbacks.onActorEvent(event);
        }
        console.log(`Domain actor event: ${JSON.stringify(event)}`);
      },
      onError: (error) => {
        console.error(`Domain actor error: ${error instanceof Error ? error.message : String(error)}`);
        if (callbacks?.onActorError) {
          callbacks.onActorError(error);
        }
      },
      onActorResult: (result) => {
        if (result.type === 'Error') {
          console.error(`Domain actor error: ${result.error instanceof Error ? result.error.message : String(result.error)}`);
          if (callbacks?.onActorError) {
            callbacks.onActorError(result.error);
          }
        } else {
          console.log(`Domain actor result: ${JSON.stringify(result)}`);
          if (callbacks?.onActorExit) {
            callbacks.onActorExit(result);
          }
        }
      }
    });

    // Get chat-state actor ID from domain actor
    const chatStateResponse = await domainActor.requestJson({
      type: 'GetChatStateActorId'
    });

    if (chatStateResponse.type !== 'ChatStateActorId' || !chatStateResponse.actor_id) {
      throw new Error(`Invalid response from git-chat-assistant: ${JSON.stringify(chatStateResponse)}`);
    }

    const chatActorId = chatStateResponse.actor_id;

    return {
      domainActor,
      chatActorId
    };
  }

  /**
   * Start the git workflow automation
   */
  async startGitWorkflow(domainActor: Actor): Promise<void> {
    const response = await domainActor.requestJson({
      type: 'StartChat'
    });

    if (response.type === 'Success') {
      return;
    } else if (response.type === 'Error') {
      throw new Error(`Failed to start git workflow: ${response.message}`);
    } else {
      throw new Error(`Invalid response from git-chat-assistant: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Send a message through the git domain actor
   */
  async sendMessage(domainActor: Actor, message: string): Promise<void> {
    const messageData = {
      type: 'AddMessage',
      message: {
        role: 'user',
        content: [{ type: 'text', text: message }]
      }
    };

    const response = await domainActor.requestJson(messageData);

    if (response.type !== 'Success') {
      throw new Error(`Git assistant rejected message: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Open a channel stream to the chat actor
   */
  async openChannelStream(chatActorId: string): Promise<ChannelStream> {
    return await this.client.openChannel({ Actor: chatActorId });
  }

  /**
   * Stop an actor
   */
  async stopActor(actor: Actor): Promise<void> {
    await actor.stop();
  }

  /**
   * Get raw theater client
   */
  getRawClient(): TheaterClient {
    return this.client;
  }
}
