/**
 * Simple input component for git-theater
 */

import { Box, Text, useInput } from 'ink';
import { useState } from 'react';

interface MultiLineInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function MultiLineInput({ placeholder = '> ', onSubmit, disabled = false }: MultiLineInputProps) {
  const [value, setValue] = useState('');

  useInput((input: string, key: any) => {
    if (disabled) return;

    if (key.return) {
      // Submit on Enter
      if (value.trim()) {
        onSubmit(value);
        setValue('');
      }
    } else if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setValue(prev => prev + input);
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
