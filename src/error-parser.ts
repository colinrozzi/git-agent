/**
 * This module provides utilities for parsing and formatting structured errors
 * from Theater actors, with a focus on extracting WasmError details for developers.
 */

/**
 * Represents a structured error from a Theater actor.
 */
export interface WitActorError {
  error_type: string;
  data: number[] | null;
}

/**
 * Represents a WasmError structure from the Theater system.
 */
export interface WasmError {
  function_name: string;
  message: string;
}

/**
 * Parses timeout data from a WitActorError.
 * The data is expected to be an 8-byte little-endian integer representing seconds.
 */
function parseTimeoutData(data: number[] | null): bigint | null {
  if (!data || data.length !== 8) return null;
  const view = new DataView(new Uint8Array(data).buffer);
  return view.getBigUint64(0, true); // little-endian
}

/**
 * Parses string data from a WitActorError.
 * The data is expected to be a UTF-8 encoded string.
 */
function parseStringData(data: number[] | null): string | null {
  if (!data) return null;
  return new TextDecoder().decode(new Uint8Array(data));
}

/**
 * Parses internal error data from a WitActorError.
 * The data is expected to be a JSON-serialized object.
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
 * Checks if an object contains a WasmError structure.
 */
function extractWasmError(obj: any): WasmError | null {
  if (!obj || typeof obj !== 'object') return null;

  // Check if this object has a WasmError
  if (obj.WasmError && typeof obj.WasmError === 'object') {
    const wasmError = obj.WasmError;
    if (wasmError.function_name && wasmError.message) {
      return {
        function_name: wasmError.function_name,
        message: wasmError.message
      };
    }
  }

  return null;
}

/**
 * Formats a WasmError into a clean, developer-friendly string.
 */
function formatWasmError(wasmError: WasmError): string {
  return `WasmError in ${wasmError.function_name}: ${wasmError.message}`;
}

/**
 * Formats a Theater actor error into a human-readable string.
 * Prioritizes extracting WasmError details for developer visibility.
 */
export function formatActorError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    // Check if this is directly a WasmError structure
    const wasmError = extractWasmError(error);
    if (wasmError) {
      return formatWasmError(wasmError);
    }
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

  // Fallback for any other error format
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  return String(error);
}

/**
 * Formats a WitActorError into a human-readable string.
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
      return `Function '${funcName || 'unknown'}' was not found in the actor.`;
    case 'type-mismatch':
      const mismatchFunc = parseStringData(data);
      return `Parameter or return type mismatch for function '${mismatchFunc || 'unknown'}'.`;
    case 'internal':
    case 'Internal':
      const internalDetails = parseInternalErrorData(data);
      
      // Check if internal details contain a WasmError at the top level
      const wasmError = extractWasmError(internalDetails);
      if (wasmError) {
        return formatWasmError(wasmError);
      }
      
      // Otherwise, just show the raw internal details
      if (internalDetails && typeof internalDetails === 'object') {
        return `Internal actor error: ${JSON.stringify(internalDetails, null, 2)}`;
      }
      
      return 'An internal actor error occurred with no details available.';
    case 'serialization-error':
      return 'Failed to serialize or deserialize data for actor communication.';
    case 'update-component-error':
      const updateErrorMsg = parseStringData(data);
      return `Failed to update the actor's component: ${updateErrorMsg || 'no details available'}.`;
    case 'paused':
      return 'The actor is paused and cannot process operations.';
    default:
      return `Unknown actor error (${error_type}): ${JSON.stringify(data)}`;
  }
}
