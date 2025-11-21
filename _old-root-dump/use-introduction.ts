import { useState, useEffect } from "react";
import { ChatEntry } from "../agent/grok-agent.js";
import { getSettingsManager } from "../utils/settings-manager.js";

export interface IntroductionState {
  needsIntroduction: boolean;
  isCollectingOperatorName: boolean;
  isCollectingAgentName: boolean;
  operatorName?: string;
  agentName?: string;
  showGreeting: boolean;
}

export function useIntroduction(
  chatHistory: ChatEntry[],
  setChatHistory: React.Dispatch<React.SetStateAction<ChatEntry[]>>
) {
  const [introductionState, setIntroductionState] = useState<IntroductionState>({
    needsIntroduction: false,
    isCollectingOperatorName: false,
    isCollectingAgentName: false,
    showGreeting: false,
  });

  // Check if introduction is needed on component mount
  useEffect(() => {
    const checkIntroductionNeeded = () => {
      try {
        const settingsManager = getSettingsManager();
        const userSettings = settingsManager.loadUserSettings();

        const hasOperatorName = userSettings.operatorName !== undefined && userSettings.operatorName !== null && userSettings.operatorName.trim().length > 0;
        const hasAgentName = userSettings.agentName !== undefined && userSettings.agentName !== null && userSettings.agentName.trim().length > 0;

        if (!hasOperatorName || !hasAgentName) {
          setIntroductionState({
            needsIntroduction: true,
            isCollectingOperatorName: !hasOperatorName,
            isCollectingAgentName: hasOperatorName && !hasAgentName,
            showGreeting: false,
          });
        }
      } catch (error) {
        // If settings manager fails, skip introduction
        console.warn('Settings manager error, skipping introduction:', error);
      }
    };

    // Only check if chat history is empty (first run)
    if (chatHistory.length === 0) {
      checkIntroductionNeeded();
    }
  }, [chatHistory.length]);

  const handleIntroductionInput = (input: string): boolean => {
    try {
      if (!introductionState.needsIntroduction || introductionState.needsIntroduction === undefined) {
        return false; // Not handling introduction
      }

      const trimmedInput = input.trim();
      if (!trimmedInput) return false;

      // Basic validation - names should be reasonable length and not contain special characters
      if (trimmedInput.length < 1 || trimmedInput.length > 50) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: "Please enter a name between 1 and 50 characters.",
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, errorEntry]);
        return true;
      }

      // Check for potentially malicious input (basic check)
      const maliciousPattern = /[<>\"'&]/;
      if (maliciousPattern.test(trimmedInput)) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: "Please use only letters, numbers, spaces, and common punctuation.",
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, errorEntry]);
        return true;
      }

      const settingsManager = getSettingsManager();

      if (introductionState.isCollectingOperatorName) {
        // Save operator name and move to agent name collection
        settingsManager.updateUserSetting('operatorName', trimmedInput);
        setIntroductionState(prev => ({
          ...prev,
          isCollectingOperatorName: false,
          isCollectingAgentName: true,
          operatorName: trimmedInput,
        }));

        // Add assistant response asking for agent name
        const agentNamePrompt: ChatEntry = {
          type: "assistant",
          content: "Great! And what would you like to call me (your AI assistant)?",
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, agentNamePrompt]);
        return true;

      } else if (introductionState.isCollectingAgentName) {
        // Save agent name and complete introduction
        settingsManager.updateUserSetting('agentName', trimmedInput);
        setIntroductionState(prev => ({
          ...prev,
          needsIntroduction: false,
          isCollectingAgentName: false,
          agentName: trimmedInput,
          showGreeting: true,
        }));

        // Add greeting message
        const userSettings = settingsManager.loadUserSettings();
        const operatorName = userSettings.operatorName || 'there';
        const greeting: ChatEntry = {
          type: "assistant",
          content: `hi ${operatorName} nice to meet you. lets get started, how can i help?`,
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, greeting]);
        return true;
      }
    } catch (error) {
      // Handle any errors gracefully
      console.warn('Introduction input error:', error);
      const errorEntry: ChatEntry = {
        type: "assistant",
        content: "There was an issue with the introduction. You can continue using the CLI normally.",
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, errorEntry]);
      return true;
    }

    return false;
  };

  const startIntroduction = () => {
    if (!introductionState.needsIntroduction) return;

    // Add initial introduction message
    const introMessage: ChatEntry = {
      type: "assistant",
      content: "Hello! I'm Grok One-Shot. Before we get started, I'd like to know a bit about you.\n\nWhat's your name?",
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, introMessage]);
  };

  // Auto-start introduction if needed
  useEffect(() => {
    if (introductionState.needsIntroduction && !introductionState.isCollectingOperatorName && !introductionState.isCollectingAgentName && chatHistory.length === 0) {
      startIntroduction();
    }
  }, [introductionState.needsIntroduction, introductionState.isCollectingOperatorName, introductionState.isCollectingAgentName, chatHistory.length]);

  return {
    introductionState,
    handleIntroductionInput,
  };
}
