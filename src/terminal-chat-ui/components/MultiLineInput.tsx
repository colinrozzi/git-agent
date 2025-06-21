/**
 * MultiLineInput - advanced multi-line input with vim-style editing (from theater-chat)
 */

import { Box, Text, useInput } from 'ink';
import { useCallback } from 'react';
import type { MultiLineInputProps } from '../types/ui.js';

/**
 * Advanced multi-line input with vim-style modal editing and cursor management
 */
export function MultiLineInput({
  placeholder = 'Type your message...',
  onSubmit,
  maxHeight = 6,
  mode = 'insert',
  onModeChange,
  content = '',
  cursorPosition = 0,
  onContentChange,
  onCursorChange,
  disabled = false
}: MultiLineInputProps) {

  // Convert content to lines for display
  const lines = content.split('\n');
  const isEmpty = content.length === 0;

  // Find cursor row and column
  const getCursorLocation = useCallback((pos: number) => {
    const beforeCursor = content.slice(0, pos);
    const row = beforeCursor.split('\n').length - 1;
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const col = lastNewline === -1 ? pos : pos - lastNewline - 1;
    return { row, col };
  }, [content]);

  const { row: cursorRow, col: cursorCol } = getCursorLocation(cursorPosition);

  // Text manipulation functions
  const insertText = useCallback((text: string) => {
    if (disabled) return;
    const before = content.slice(0, cursorPosition);
    const after = content.slice(cursorPosition);
    const newContent = before + text + after;
    const newCursor = cursorPosition + text.length;

    onContentChange?.(newContent);
    onCursorChange?.(newCursor);
  }, [content, cursorPosition, onContentChange, onCursorChange, disabled]);

  const deleteChar = useCallback((direction: 'forward' | 'backward' = 'backward') => {
    if (disabled) return;
    
    if (direction === 'backward' && cursorPosition > 0) {
      const before = content.slice(0, cursorPosition - 1);
      const after = content.slice(cursorPosition);
      const newContent = before + after;
      const newCursor = cursorPosition - 1;

      onContentChange?.(newContent);
      onCursorChange?.(newCursor);
    } else if (direction === 'forward' && cursorPosition < content.length) {
      const before = content.slice(0, cursorPosition);
      const after = content.slice(cursorPosition + 1);
      const newContent = before + after;

      onContentChange?.(newContent);
      // Cursor stays same for forward delete
    }
  }, [content, cursorPosition, onContentChange, onCursorChange, disabled]);

  const moveCursor = useCallback((newPos: number) => {
    if (disabled) return;
    const clampedPos = Math.max(0, Math.min(content.length, newPos));
    onCursorChange?.(clampedPos);
  }, [content.length, onCursorChange, disabled]);

  const handleSubmit = useCallback((): void => {
    if (disabled) return;
    const trimmed = content.trim();
    if (trimmed) {
      onSubmit(trimmed);
      // Clear the input after successful submission
      onContentChange?.('');
      onCursorChange?.(0);
    }
  }, [content, onSubmit, onContentChange, onCursorChange, disabled]);

  // Key input handler
  useInput((input: string, key: any) => {
    if (disabled) return;

    if (key.escape) {
      onModeChange?.('command');
      return;
    }

    // Handle return key for both modes
    if (key.return) {
      if (mode === 'command') {
        // In command mode, plain Return submits
        handleSubmit();
        return;
      } else if (mode === 'insert') {
        // In insert mode, Return adds newline, Ctrl+Return submits
        if (key.ctrl) {
          handleSubmit();
          return;
        } else {
          insertText('\n');
          return;
        }
      }
    }

    // Regular characters
    if (input && !key.ctrl && !key.meta) {
      insertText(input);
      return;
    }

    // Navigation only works in insert mode
    if (mode !== 'insert') return;

    // Arrow key navigation
    if (key.leftArrow) {
      moveCursor(cursorPosition - 1);
      return;
    }
    if (key.rightArrow) {
      moveCursor(cursorPosition + 1);
      return;
    }

    // Up/down arrow navigation
    if (key.upArrow) {
      const currentLineStart = content.lastIndexOf('\n', cursorPosition - 1);
      const prevLineStart = currentLineStart > 0 ? content.lastIndexOf('\n', currentLineStart - 1) : -1;
      if (prevLineStart !== -1) {
        const targetCol = cursorCol;
        const prevLineEnd = currentLineStart;
        const prevLineLength = prevLineEnd - prevLineStart - 1;
        const newPos = prevLineStart + 1 + Math.min(targetCol, prevLineLength);
        moveCursor(newPos);
      }
      return;
    }
    if (key.downArrow) {
      const currentLineEnd = content.indexOf('\n', cursorPosition);
      if (currentLineEnd !== -1) {
        const nextLineEnd = content.indexOf('\n', currentLineEnd + 1);
        const targetCol = cursorCol;
        const nextLineStart = currentLineEnd + 1;
        const nextLineLength = nextLineEnd !== -1 ? nextLineEnd - nextLineStart : content.length - nextLineStart;
        const newPos = nextLineStart + Math.min(targetCol, nextLineLength);
        moveCursor(newPos);
      }
      return;
    }

    // Delete
    if (key.backspace || key.delete) {
      deleteChar('backward');
      return;
    }
  });

  // Render
  const displayLines = lines.slice(0, maxHeight);
  const hasMoreLines = lines.length > maxHeight;

  return (
    <Box flexDirection="column" width="100%">
      <Box
        borderStyle="round"
        borderColor={disabled ? "gray" : "gray"}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="column"
        minHeight={3}
        width="80%"
      >
        <Box flexDirection="column">
          {isEmpty ? (
            <Text>
              <Text backgroundColor="white" color="black"> </Text>
              <Text color="gray">{placeholder}</Text>
            </Text>
          ) : (
            displayLines.map((line, index) => {
              const isCurrentLine = index === cursorRow && cursorRow < maxHeight;

              if (!isCurrentLine) {
                return <Text key={index}>{line}</Text>;
              }

              const beforeCursor = line.slice(0, cursorCol);
              const atCursor = cursorCol < line.length ? line[cursorCol] : ' ';
              const afterCursor = cursorCol < line.length ? line.slice(cursorCol + 1) : '';

              return (
                <Text key={index}>
                  {beforeCursor}
                  <Text backgroundColor={disabled ? "gray" : "white"} color="black">
                    {atCursor}
                  </Text>
                  {afterCursor}
                </Text>
              );
            })
          )}

          {hasMoreLines && (
            <Text color="gray" dimColor>
              ... {lines.length - maxHeight} more lines
            </Text>
          )}
        </Box>
      </Box>

      <Box justifyContent="space-between">
        <Text color={mode === 'insert' ? 'green' : 'blue'} dimColor>
          {mode?.toUpperCase() || 'INSERT'}
        </Text>
        <Text color="gray" dimColor>
          Line {cursorRow + 1}, Col {cursorCol + 1}
          {lines.length > 1 && ` • ${lines.length} lines`}
          {!isEmpty && ` • ${content.length} chars`}
        </Text>
      </Box>
    </Box>
  );
}
