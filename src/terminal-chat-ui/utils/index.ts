/**
 * Export all utilities for easy importing
 */

export {
  getMessagePrefixes,
  getMessageColor,
  formatMessageContent,
  extractToolInfo,
  filterMessages
} from './messageFormatting.js';

export {
  validateTheaterConfig,
  getSetupStatusInfo,
  parseTheaterMessage,
  extractMessageContent,
  createDefaultTheaterConfig,
  generateActorId
} from './theaterHelpers.js';
