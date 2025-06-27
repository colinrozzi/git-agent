/**
 * Theater client wrapper for git workflows using task-manager
 */

import { TheaterClient, Actor, ChannelStream, setLogLevel } from 'theater-client';
import type { GitAgentConfig, ChatSession } from './types.js';

// New type for actor lifecycle callbacks
export interface ActorLifecycleCallbacks {
  onActorExit?: (result: any) => void;
  onActorError?: (error: any) => void;
  onActorEvent?: (event: any) => void;
}

export class GitAgentClient {
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
      },
      onError: (error) => {
        // Call user-provided error callback
        if (callbacks?.onActorError) {
          callbacks.onActorError(error);
        }
      },
      onActorResult: (result) => {
        // This gets called when the actor exits/completes
        // Call user-provided exit callback
        if (callbacks?.onActorExit) {
          callbacks.onActorExit(result);
        }
      }
    });

    return actor;
  }

  /**
   * Get the chat state actor ID from a task-manager actor
   */
  async getChatStateActorId(taskManagerActor: Actor): Promise<string> {
    const response = await taskManagerActor.requestJson({
      type: 'GetChatStateActorId'
    });

    if (response.type !== 'ChatStateActorId' || !response.actor_id) {
      throw new Error(`Invalid response from task-manager: ${JSON.stringify(response)}`);
    }

    return response.actor_id;
  }

  /**
   * Start a git workflow session using task-manager with lifecycle callbacks
   */
  async startGitSession(config: GitAgentConfig, callbacks?: ActorLifecycleCallbacks): Promise<ChatSession> {
    // Start task-manager actor
    const taskManagerActor = await this.client.startActor({
      manifest: config.actor.manifest_path,
      initialState: new TextEncoder().encode(JSON.stringify(config.actor.initial_state)),
      onEvent: (event) => {
        if (callbacks?.onActorEvent) {
          callbacks.onActorEvent(event);
        }
      },
      onError: (error) => {
        if (callbacks?.onActorError) {
          callbacks.onActorError(error);
        }
      },
      onActorResult: (result) => {
        if (result.type === 'Error') {
          if (callbacks?.onActorError) {
            callbacks.onActorError(result.error);
          }
        } else {
          if (callbacks?.onActorExit) {
            callbacks.onActorExit(result);
          }
        }
      }
    });

    // Get chat-state actor ID from task-manager
    const chatStateResponse = await taskManagerActor.requestJson({
      type: 'GetChatStateActorId'
    });

    if (chatStateResponse.type !== 'ChatStateActorId' || !chatStateResponse.actor_id) {
      throw new Error(`Invalid response from task-manager: ${JSON.stringify(chatStateResponse)}`);
    }

    const chatActorId = chatStateResponse.actor_id;

    return {
      domainActor: taskManagerActor,
      chatActorId
    };
  }

  /**
   * Start the git workflow automation using task-manager
   */
  async startGitWorkflow(taskManagerActor: Actor): Promise<void> {
    const response = await taskManagerActor.requestJson({
      type: 'StartChat'
    });

    if (response.type === 'Success') {
      return;
    } else if (response.type === 'Error') {
      throw new Error(`Failed to start git workflow: ${response.message}`);
    } else {
      throw new Error(`Invalid response from task-manager: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Send a message through the task-manager actor
   */
  async sendMessage(taskManagerActor: Actor, message: string): Promise<void> {
    const messageData = {
      type: 'AddMessage',
      message: {
        role: 'user',
        content: [{ type: 'text', text: message }]
      }
    };

    const response = await taskManagerActor.requestJson(messageData);

    if (response.type !== 'Success') {
      throw new Error(`Task manager rejected message: ${JSON.stringify(response)}`);
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
