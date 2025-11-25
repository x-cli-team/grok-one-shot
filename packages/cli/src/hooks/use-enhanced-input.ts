import { useState, useCallback, useRef } from "react";
import {
  deleteCharBefore,
  deleteCharAfter,
  deleteWordBefore,
  deleteWordAfter,
  insertText,
  moveToLineStart,
  moveToLineEnd,
  moveToPreviousWord,
  moveToNextWord,
} from "../lib/utils/text-utils.js";
import { useInputHistory } from "./use-input-history.js";

// Debug logging disabled - cursor desync fix verified
const enhancedLog = (...args: any[]) => {
  // Disabled debug logging
};

export interface Key {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  paste?: boolean;
  sequence?: string;
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  return?: boolean;
  escape?: boolean;
  tab?: boolean;
  backspace?: boolean;
  delete?: boolean;
}

export interface EnhancedInputHook {
  input: string;
  cursorPosition: number;
  isMultiline: boolean;
  setInput: (text: string) => void;
  setCursorPosition: (position: number) => void;
  clearInput: () => void;
  insertAtCursor: (text: string) => void;
  resetHistory: () => void;
  handleInput: (inputChar: string, key: Key) => void;
}

interface UseEnhancedInputProps {
  onSubmit?: (text: string) => void;
  onEscape?: () => void;
  onSpecialKey?: (key: Key) => boolean; // Return true to prevent default handling
  disabled?: boolean;
  multiline?: boolean;
}

export function useEnhancedInput({
  onSubmit,
  onEscape,
  onSpecialKey,
  disabled = false,
  multiline = false,
}: UseEnhancedInputProps = {}): EnhancedInputHook {
  const [input, setInputState] = useState("");
  const [cursorPosition, setCursorPositionState] = useState(0);
  
  // Direct state setters - debug wrappers removed
  const setInputDirect = setInputState;
  const setCursorPositionDirect = setCursorPositionState;
  const isMultilineRef = useRef(multiline);
  
  const {
    addToHistory,
    navigateHistory,
    resetHistory,
    setOriginalInput,
    isNavigatingHistory,
  } = useInputHistory();

  const setInput = useCallback((text: string) => {
    setInputDirect(text);
    // ⚠️ CURSOR DESYNC FIX: Don't automatically adjust cursor position in setInput
    // This was causing cursor to jump backward and create the "word pushing" effect
    // The cursor position should only be managed by explicit cursor operations
    if (!isNavigatingHistory()) {
      setOriginalInput(text);
    }
  }, []); // ⚠️ STALE CLOSURE FIX: Remove dependencies to prevent cursor desync

  const setCursorPosition = useCallback((position: number) => {
    // Access current input length directly from state rather than closure
    setInputState(currentInput => {
      setCursorPositionDirect(Math.max(0, Math.min(currentInput.length, position)));
      return currentInput; // Don't change the input, just use it for length
    });
  }, []);

  const clearInput = useCallback(() => {
    setInputDirect("");
    setCursorPositionDirect(0);
    setOriginalInput("");
  }, [setOriginalInput]);

  const insertAtCursor = useCallback((text: string) => {
    // Access current state directly to avoid stale closures
    setInputState(currentInput => {
      setCursorPositionState(currentCursor => {
        const result = insertText(currentInput, currentCursor, text);
        setInputDirect(result.text);
        setCursorPositionDirect(result.position);
        setOriginalInput(result.text);
        return result.position;
      });
      return currentInput;
    });
  }, [setOriginalInput]);

  const handleSubmit = useCallback(() => {
    // Access current input directly to avoid stale closures
    setInputState(currentInput => {
      if (currentInput.trim()) {
        addToHistory(currentInput);
        onSubmit?.(currentInput);
        clearInput();
      }
      return currentInput;
    });
  }, [addToHistory, onSubmit, clearInput]);

  const handleInput = useCallback((inputChar: string, key: Key) => {
    if (disabled) {
      return;
    }

    // Handle Ctrl+C - check multiple ways it could be detected
    if ((key.ctrl && inputChar === "c") || inputChar === "\x03") {
      setInputDirect("");
      setCursorPositionDirect(0);
      setOriginalInput("");
      return;
    }

    // Allow special key handler to override default behavior
    if (onSpecialKey?.(key)) {
      return;
    }

    // Handle Escape
    if (key.escape) {
      onEscape?.();
      return;
    }

    // Handle Enter/Return
    if (key.return) {
      if (multiline && key.shift) {
        // Shift+Enter in multiline mode inserts newline
        const result = insertText(input, cursorPosition, "\n");
        setInputDirect(result.text);
        setCursorPositionDirect(result.position);
        setOriginalInput(result.text);
      } else {
        handleSubmit();
      }
      return;
    }

    // Handle history navigation
    if ((key.upArrow || key.name === 'up') && !key.ctrl && !key.meta) {
      const historyInput = navigateHistory("up");
      if (historyInput !== null) {
        setInputDirect(historyInput);
        setCursorPositionDirect(historyInput.length);
      }
      return;
    }

    if ((key.downArrow || key.name === 'down') && !key.ctrl && !key.meta) {
      const historyInput = navigateHistory("down");
      if (historyInput !== null) {
        setInputDirect(historyInput);
        setCursorPositionDirect(historyInput.length);
      }
      return;
    }

    // ⚠️ CURSOR JUMPING FIX: Filter out phantom arrow key events
    // These occur when inputChar is empty but arrow keys are detected
    // This is a terminal compatibility issue causing false cursor movements
    const isEmpty = !inputChar || inputChar === '' || inputChar === '(empty)';
    if ((key.leftArrow || key.rightArrow || key.upArrow || key.downArrow) && isEmpty) {
      return; // Ignore phantom arrow keys
    }

    // Handle cursor movement - ignore meta flag for arrows as it's unreliable in terminals
    // Only do word movement if ctrl is pressed AND no arrow escape sequence is in inputChar
    if ((key.leftArrow || key.name === 'left') && key.ctrl && !inputChar.includes('[')) {
      const newPos = moveToPreviousWord(input, cursorPosition);
      setCursorPositionDirect(newPos);
      return;
    }

    if ((key.rightArrow || key.name === 'right') && key.ctrl && !inputChar.includes('[')) {
      const newPos = moveToNextWord(input, cursorPosition);
      setCursorPositionDirect(newPos);
      return;
    }

    // Handle regular cursor movement - single character (ignore meta flag)
    if (key.leftArrow || key.name === 'left') {
      const newPos = Math.max(0, cursorPosition - 1);
      setCursorPositionDirect(newPos);
      return;
    }

    if (key.rightArrow || key.name === 'right') {
      const newPos = Math.min(input.length, cursorPosition + 1);
      setCursorPositionDirect(newPos);
      return;
    }

    // Handle Home/End keys or Ctrl+A/E
    if ((key.ctrl && inputChar === "a") || key.name === "home") {
      setCursorPositionDirect(0); // Simple start of input
      return;
    }

    if ((key.ctrl && inputChar === "e") || key.name === "end") {
      setCursorPositionDirect(input.length); // Simple end of input
      return;
    }

    // Handle deletion - check multiple ways backspace might be detected
    // Backspace can be detected in different ways depending on terminal
    // In some terminals, backspace shows up as delete:true with empty inputChar
    const isBackspace = key.backspace || 
                       key.name === 'backspace' || 
                       inputChar === '\b' || 
                       inputChar === '\x7f' ||
                       (key.delete && inputChar === '' && !key.shift);
                       
    if (isBackspace) {
      if (key.ctrl || key.meta) {
        // Ctrl/Cmd + Backspace: Delete word before cursor
        const result = deleteWordBefore(input, cursorPosition);
        setInputDirect(result.text);
        setCursorPositionDirect(result.position);
        setOriginalInput(result.text);
      } else {
        // Regular backspace
        const result = deleteCharBefore(input, cursorPosition);
        setInputDirect(result.text);
        setCursorPositionDirect(result.position);
        setOriginalInput(result.text);
      }
      return;
    }

    // Handle forward delete (Del key) - but not if it was already handled as backspace above
    if ((key.delete && inputChar !== '') || (key.ctrl && inputChar === "d")) {
      if (key.ctrl || key.meta) {
        // Ctrl/Cmd + Delete: Delete word after cursor
        const result = deleteWordAfter(input, cursorPosition);
        setInputDirect(result.text);
        setCursorPositionDirect(result.position);
        setOriginalInput(result.text);
      } else {
        // Regular delete
        const result = deleteCharAfter(input, cursorPosition);
        setInputDirect(result.text);
        setCursorPositionDirect(result.position);
        setOriginalInput(result.text);
      }
      return;
    }

    // Handle Ctrl+K: Delete from cursor to end of line
    if (key.ctrl && inputChar === "k") {
      const lineEnd = moveToLineEnd(input, cursorPosition);
      const newText = input.slice(0, cursorPosition) + input.slice(lineEnd);
      setInputDirect(newText);
      setOriginalInput(newText);
      return;
    }

    // Handle Ctrl+U: Delete from cursor to start of line
    if (key.ctrl && inputChar === "u") {
      const lineStart = moveToLineStart(input, cursorPosition);
      const newText = input.slice(0, lineStart) + input.slice(cursorPosition);
      setInputDirect(newText);
      setCursorPositionDirect(lineStart);
      setOriginalInput(newText);
      return;
    }

    // Handle Ctrl+W: Delete word before cursor
    if (key.ctrl && inputChar === "w") {
      const result = deleteWordBefore(input, cursorPosition);
      setInputDirect(result.text);
      setCursorPositionDirect(result.position);
      setOriginalInput(result.text);
      return;
    }

    // Handle Ctrl+X: Clear entire input
    if (key.ctrl && inputChar === "x") {
      setInputDirect("");
      setCursorPositionDirect(0);
      setOriginalInput("");
      return;
    }

    // Handle regular character input
    if (inputChar && !key.ctrl && !key.meta) {
      const result = insertText(input, cursorPosition, inputChar);
      setInputDirect(result.text);
      setCursorPositionDirect(result.position);
      setOriginalInput(result.text);
    }
  }, [disabled, onSpecialKey, multiline, handleSubmit, navigateHistory, setOriginalInput]); // ⚠️ STALE CLOSURE FIX: Removed input, cursorPosition dependencies

  return {
    input,
    cursorPosition,
    isMultiline: isMultilineRef.current,
    setInput,
    setCursorPosition,
    clearInput,
    insertAtCursor,
    resetHistory,
    handleInput,
  };
}