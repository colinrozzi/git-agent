/**
 * Theater client wrapper for git workflows
 */

import { TheaterClient, Actor, ChannelStream, setLogLevel } from 'theater-client';
import type { GitTheaterConfig, ChatSession } from './types.js';

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
        timeout: 300000, // 5 minutes for chat UI
        retryAttempts: 3,
        retryDelay: 1000
      }
    );
  }

  /**
   * Start a git workflow session
   */
  async startGitSession(config: GitTheaterConfig): Promise<ChatSession> {
    // Start git-chat-assistant domain actor
    const domainActor = await this.client.startActor({
      manifest: config.actor.manifest_path,
      initialState: new TextEncoder().encode(JSON.stringify(config.actor.initial_state)),
      parent: false,
      subscribe: false
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
