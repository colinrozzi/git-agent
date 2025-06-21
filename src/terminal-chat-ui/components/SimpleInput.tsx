/**
 * SimpleInput - basic single-line input (from git-theater style)
 */

import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import type { SimpleInputProps } from '../types/ui.js';

/**
 * Simple, lightweight input component for quick interactions
 */
export function SimpleInput({ 
  placeholder = '> ', 
  onSubmit, 
  disabled = false, 
  value: controlledValue,
  onChange
}: SimpleInputProps) {
  const [internalValue, setInternalValue] = useState('');
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled ? (onChange || (() => {})) : setInternalValue;

  useInput((input: string, key: any) => {
    if (disabled) return;

    if (key.return) {
      // Submit on Enter
      if (value.trim()) {
        onSubmit(value.trim());
        if (!isControlled) {
          setInternalValue('');
        }
      }
    } else if (key.backspace || key.delete) {
      setValue(value.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setValue(value + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">{placeholder}</Text>
        <Text color="white">{value}</Text>
        {!disabled && <Text backgroundColor="gray"> </Text>}
      </Box>
      
      {!disabled && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press Enter to send
          </Text>
        </Box>
      )}
    </Box>
  );
}
