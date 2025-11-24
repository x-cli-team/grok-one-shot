// #!/usr/bin/env node

import React from "react";
import { render } from "ink";
import { program } from "commander";
import * as dotenv from "dotenv";
import path from "path";
import chalk from "chalk";
let v8: any = null;
try {
  v8 = require('v8');
} catch {
  // v8 not available in Bun
}

// Load environment variables first
dotenv.config();








// API key will be checked later when actually needed



// Import core modules with error handling
try {
  const { GrokAgent } = await import("./agent/grok-agent.js");
  const ChatInterface = (await import("./ui/components/chat-interface.js")).default;
  const { printWelcomeBanner } = await import("./hooks/use-console-setup.js");
  const { getSettingsManager } = await import("./lib/utils/settings-manager.js");
  const { ConfirmationService } = await import("./lib/utils/confirmation-service.js");
  const { renderMarkdownToConsole } = await import("./lib/utils/console-markdown.js");
  const { createMCPCommand } = await import("./commands/mcp.js");
  const { createSetNameCommand } = await import("./commands/set-name.js");
  const { createToggleConfirmationsCommand } = await import("./commands/toggle-confirmations.js");
  const pkg = await import("../package.json", { with: { type: "json" } });
  const { checkForUpdates } = await import("./lib/utils/version-checker.js");

  
  // Setup error handlers
  process.on("SIGTERM", () => {
    process.exit(0);
  });

  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught exception:", error.message);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled rejection:", reason);
    process.exit(1);
  });

  // Helper functions
  function loadModel(): string | undefined {
    let model = process.env.GROK_MODEL;
    if (!model) {
      try {
        const manager = getSettingsManager();
        model = manager.getCurrentModel?.();
      } catch {
        model = process.env.GROK_MODEL || "grok-beta";  // Use env or fallback
      }
    }
    return model;
  }

  async function saveCommandLineSettings(apiKey?: string, baseURL?: string): Promise<void> {
    try {
      const manager = getSettingsManager();
      if (apiKey) {
        manager.updateUserSetting("apiKey", apiKey);
      }
      if (baseURL) {
        manager.updateUserSetting("baseURL", baseURL);
      }
    } catch (error) {
    }
  }

  // Main CLI setup
  try {

    program
      .name("grok one shot")
      .description("AI-powered CLI assistant")
      .version(pkg.default.version)
      .argument("[message...]", "Initial message to send to Grok")
      .option("-d, --directory <dir>", "set working directory", process.cwd())
      .option("-k, --api-key <key>", "X API key")
      .option("-u, --base-url <url>", "Grok API base URL")
      .option("-m, --model <model>", "AI model to use")
      .option("-p, --prompt <prompt>", "process a single prompt and exit (headless mode)")
      .option("--max-tool-rounds <rounds>", "maximum tool rounds", "400")
      .option("-q, --quiet", "suppress startup banner and messages")
      .action(async (message, options) => {
        
        // Check for API key when actually needed
        const apiKey = options.apiKey || process.env.GROK_API_KEY;

        if (!apiKey) {
          console.error("❌ No API key found. Use -k flag or set GROK_API_KEY environment variable.");
          process.exit(1);
        }
        
        if (options.directory) {
          try {
            process.chdir(options.directory);
          } catch (error) {
            process.exit(1);
          }
        }

        if (options.apiKey || options.baseUrl) {
          await saveCommandLineSettings(options.apiKey, options.baseUrl);
        }

        // Create GrokAgent with validated API key
        const manager = getSettingsManager();
        const verbosityLevel = manager.getUserSetting('verbosityLevel') || 'quiet';
        const explainLevel = manager.getUserSetting('explainLevel') || 'brief';
        const baseURL = options.baseUrl || process.env.GROK_BASE_URL;
        const model = options.model || loadModel();
        const maxToolRounds = parseInt(options.maxToolRounds || process.env.MAX_TOOL_ROUNDS || "400");
        
        const agent = new GrokAgent(apiKey, baseURL, model, maxToolRounds, undefined, verbosityLevel, explainLevel);



        // Headless mode: process prompt and exit
        if (options.prompt) {
          try {
            const confirmationService = ConfirmationService.getInstance();
            confirmationService.setSessionFlag("allOperations", true);

            const chatEntries = await agent.processUserMessage(options.prompt);
            
            // Output assistant responses with markdown rendering and consistent prefix
            for (const entry of chatEntries) {
              if (entry.type === "assistant" && entry.content) {
              }
            }
          } catch (error) {
            process.exit(1);
          }
          return;
        }

        // Interactive mode: launch UI
        if (!process.stdin.isTTY) {
          console.error("❌ Error: X CLI requires an interactive terminal.");
          process.exit(1);
        }

        // Documentation available via GROK.md + docs-index.md (loaded on-demand)
        // Old system loaded 50k-70k tokens here - new system loads ~700 tokens via useCLAUDEmd hook
        
        // Print welcome banner
        if (!options.quiet) {
          printWelcomeBanner(options.quiet);
        }

        const initialMessage = Array.isArray(message) ? message.join(" ") : (message || "");
        const app = render(React.createElement(ChatInterface, {
          agent,
          initialMessage,
          quiet: options.quiet
        }));

        // Cleanup on exit
        const cleanup = () => {
          app.unmount();
          try {
            agent.abortCurrentOperation?.();
            stopPeriodicMemoryLogging();
          } catch {
            // Ignore cleanup errors
          }
        };

        process.on('exit', cleanup);
        process.on('SIGINT', () => {
          cleanup();
          process.exit(0);
        });
        process.on('SIGTERM', cleanup);
      });

    // Add subcommands
    program.addCommand(createMCPCommand());
    program.addCommand(createSetNameCommand());
    program.addCommand(createToggleConfirmationsCommand());

    program.parse();
    
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }

} catch (error) {
  console.error("💥 Failed to load modules:", error);
  process.exit(1);
}
