/**
 * SmartInput - intelligent input that switches between simple and multiline modes
 */

import { useState, useEffect } from 'react';
import { SimpleInput } from './SimpleInput.js';
import { MultiLineInput } from './MultiLineInput.js';
import type { SmartInputProps } from '../types/ui.js';

/**
 * Intelligent input component that automatically switches between simple and multiline modes
 * based on content length and user preference
 */
export function SmartInput({ 
  mode = 'auto', 
  onSubmit, 
  placeholder, 
  disabled = false,
  autoMultilineThreshold = 50,
  maxHeight = 6
}: SmartInputProps) {
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentMode, setCurrentMode] = useState<'simple' | 'multiline'>('simple');
  const [inputMode, setInputMode] = useState<'insert' | 'command'>('insert');

  // Determine which input mode to use
  useEffect(() => {
    if (mode === 'auto') {
      // Auto-switch based on content length or newlines
      const shouldUseMultiline = 
        content.length > autoMultilineThreshold || 
        content.includes('\n');
      
      setCurrentMode(shouldUseMultiline ? 'multiline' : 'simple');
    } else {
      setCurrentMode(mode);
    }
  }, [content, mode, autoMultilineThreshold]);

  // Handle submission
  const handleSubmit = (value: string) => {
    onSubmit(value);
    setContent('');
    setCursorPosition(0);
  };

  // If using simple mode
  if (currentMode === 'simple') {
    return (
      <SimpleInput
        placeholder={placeholder}
        onSubmit={handleSubmit}
        disabled={disabled}
        value={content}
        onChange={setContent}
      />
    );
  }

  // If using multiline mode
  return (
    <MultiLineInput
      placeholder={placeholder}
      onSubmit={handleSubmit}
      disabled={disabled}
      maxHeight={maxHeight}
      mode={inputMode}
      onModeChange={setInputMode}
      content={content}
      cursorPosition={cursorPosition}
      onContentChange={setContent}
      onCursorChange={setCursorPosition}
    />
  );
}
