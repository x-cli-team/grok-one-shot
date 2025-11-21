    // Smart-push command - delegates to npm script
    if (trimmedInput === "/smart-push") {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const result = await agent.executeBashCommand("npm run smart-push");
        
        const resultEntry: ChatEntry = {
          type: "tool_result",
          content: result.success ? "🎉 Smart Push Completed Successfully!" : `❌ Smart Push Failed: ${result.error}`,
          timestamp: new Date(),
          toolCall: {
            id: `smart_push_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: "npm run smart-push" }) },
          },
          toolResult: result,
        };
        setChatHistory((prev) => [...prev, resultEntry]);

      } catch (error: unknown) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ Smart Push Failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }