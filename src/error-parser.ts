/**
 * This module provides utilities for parsing and formatting structured errors
 * from Theater actors, based on the WitActorError format.
 */

/**
 * Represents a structured error from a Theater actor.
 */
export interface WitActorError {
  error_type: string;
  data: number[] | null;
}

/**
 * Parses timeout data from a WitActorError.
 * The data is expected to be an 8-byte little-endian integer representing seconds.
 * @param data The byte array from the error.
 * @returns The timeout duration in seconds as a BigInt, or null if data is invalid.
 */
function parseTimeoutData(data: number[] | null): bigint | null {
  if (!data || data.length !== 8) return null;
  const view = new DataView(new Uint8Array(data).buffer);
  return view.getBigUint64(0, true); // little-endian
}

/**
 * Parses string data from a WitActorError.
 * The data is expected to be a UTF-8 encoded string.
 * @param data The byte array from the error.
 * @returns The decoded string, or null if data is invalid.
 */
function parseStringData(data: number[] | null): string | null {
  if (!data) return null;
  return new TextDecoder().decode(new Uint8Array(data));
}

/**
 * Parses internal error data from a WitActorError.
 * The data is expected to be a JSON-serialized object.
 * @param data The byte array from the error.
 * @returns The parsed JSON object, or a fallback string if parsing fails.
 */
function parseInternalErrorData(data: number[] | null): any {
  if (!data) return null;
  const jsonStr = new TextDecoder().decode(new Uint8Array(data));
  try {
    return JSON.parse(jsonStr);
  } catch {
    return 'Could not parse internal error details.';
  }
}

/**
 * Formats a Theater actor error into a human-readable string.
 * @param error The error object, which can be a standard Error, a WitActorError, or something else.
 * @returns A user-friendly error message.
 */
export function formatActorError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    // Handle {"Internal": {"data": [...]}} structure
    const errorKeys = Object.keys(error);
    if (errorKeys.length === 1) {
      const errorType = errorKeys[0];
      const errorPayload = error[errorType];
      if (typeof errorPayload === 'object' && errorPayload !== null && 'data' in errorPayload) {
        return formatWitActorError(errorType, errorPayload.data);
      }
    }

    // Handle {"error_type": "...", "data": [...]} structure
    if ('error_type' in error) {
      const witError = error as WitActorError;
      return formatWitActorError(witError.error_type, witError.data);
    }
  }

  // Fallback for any other error format.
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  return String(error);
}

/**
 * Formats a WitActorError into a human-readable string.
 * @param error_type The type of the error.
 * @param data The data associated with the error.
 * @returns A user-friendly error message.
 */
function formatWitActorError(error_type: string, data: any): string {
  switch (error_type) {
    case 'operation-timeout':
      const timeout = parseTimeoutData(data);
      return `Operation timed out after ${timeout ? `${timeout} seconds` : 'a specified duration'}.`;
    case 'channel-closed':
      return 'Communication channel to the actor was closed unexpectedly.';
    case 'shutting-down':
      return 'Actor is shutting down and cannot accept new operations.';
    case 'function-not-found':
      const funcName = parseStringData(data);
      return `Error: The function '${funcName || 'unknown'}' was not found in the actor.`;
    case 'type-mismatch':
      const mismatchFunc = parseStringData(data);
      return `Error: A parameter or return type did not match for function '${mismatchFunc || 'unknown'}'.`;
    case 'internal':
    case 'Internal': // To handle the new structure
      const internalDetails = parseInternalErrorData(data);
      if (internalDetails && typeof internalDetails.description === 'string') {
        return `An internal actor error occurred: ${internalDetails.description}`;
      }
      // We'll return a concise message and log the details for debugging.
      console.error('Internal actor error details:', JSON.stringify(internalDetails, null, 2));
      return 'An internal actor error occurred. Check the logs for more details.';
    case 'serialization-error':
      return 'Failed to serialize or deserialize data for actor communication.';
    case 'update-component-error':
      const updateErrorMsg = parseStringData(data);
      return `Failed to update the actor's component: ${updateErrorMsg || 'no details available'}.`;
    case 'paused':
      return 'The actor is paused and cannot process operations.';
    default:
      // For unknown error types, we'll stringify the whole object.
      return `An unknown actor error occurred: ${JSON.stringify({ error_type, data })}`;
  }
}
