import * as fs from "fs";
import { ToolResult } from "../types/index.js";

export interface SmartEditOptions {
  path: string;
  oldStr: string;
  newStr: string;
  replaceAll?: boolean;
  maxRetries?: number;
}

export class SmartEditTool {
  private maxRetries: number = 3;

  async execute(options: SmartEditOptions): Promise<ToolResult> {
    const { path, oldStr, newStr, replaceAll = false, maxRetries = this.maxRetries } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Attempt the replacement using direct file operations for testing
        const result = await this.performEdit(path, oldStr, newStr, replaceAll);
        return result;
      } catch (error: any) {
        if (error.message?.includes("not found") && attempt < maxRetries) {
          console.log(`SmartEdit: Attempt ${attempt} failed, fetching exact content...`);

          // Fetch exact content and find best match
          const exactOldStr = await this.findBestMatch(path, oldStr);

          if (exactOldStr) {
            console.log(`SmartEdit: Retrying with exact match...`);
            try {
              const result = await this.performEdit(path, exactOldStr, newStr, replaceAll);
              return result;
            } catch (retryError: any) {
              console.log(`SmartEdit: Retry ${attempt} also failed: ${retryError.message}`);
            }
          }
        } else {
          // Max retries reached or different error
          return {
            success: false,
            output: `SmartEdit failed after ${maxRetries} attempts: ${error.message}`,
          };
        }
      }
    }

    return {
      success: false,
      output: "SmartEdit: All retry attempts exhausted",
    };
  }

  private async performEdit(path: string, oldStr: string, newStr: string, replaceAll: boolean): Promise<ToolResult> {
    try {
      const content = await fs.promises.readFile(path, 'utf8');
      let newContent: string;

      if (replaceAll) {
        newContent = content.split(oldStr).join(newStr);
      } else {
        const index = content.indexOf(oldStr);
        if (index === -1) {
          throw new Error("String not found in file");
        }
        newContent = content.slice(0, index) + newStr + content.slice(index + oldStr.length);
      }

      await fs.promises.writeFile(path, newContent, 'utf8');

      return {
        success: true,
        output: `Successfully edited ${path}`,
      };
    } catch (error: any) {
      throw new Error(`Edit failed: ${error.message}`);
    }
  }

  private async findBestMatch(path: string, approximateOldStr: string): Promise<string | null> {
    try {
      const content = await fs.promises.readFile(path, 'utf8');
      const lines = approximateOldStr.split('\n');

      // Simple fuzzy match: find a substring that closely matches
      for (let i = 0; i <= content.length - approximateOldStr.length; i++) {
        const substring = content.substr(i, approximateOldStr.length);
        // Check if most lines match
        const matchCount = lines.filter((line, idx) => {
          const contentLines = content.split('\n');
          return contentLines[i + idx]?.includes(line.trim());
        }).length;

        if (matchCount >= lines.length * 0.8) { // 80% match
          return substring;
        }
      }

      // Fallback: return the first occurrence of the first line
      const firstLine = lines[0];
      const index = content.indexOf(firstLine);
      if (index !== -1) {
        return content.substr(index, approximateOldStr.length);
      }

      return null;
    } catch (error: any) {
      console.error("SmartEdit: Failed to find best match:", error);
      return null;
    }
  }
}