import { Command } from 'commander';
import { getSettingsManager } from '../utils/settings-manager.js';
import chalk from 'chalk';

export function createSetNameCommand(): Command {
  const setNameCommand = new Command('set-name');
  setNameCommand
    .description('Set a custom name for the AI assistant')
    .argument('<name>', 'The name to set for the assistant')
    .action(async (name: string) => {
      try {
        const settingsManager = getSettingsManager();
        settingsManager.updateUserSetting('assistantName', name);
        console.log(chalk.green(`✅ Assistant name set to: ${name}`));
      } catch (error: any) {
        console.error(chalk.red(`❌ Failed to set assistant name: ${error.message}`));
        process.exit(1);
      }
    });

  return setNameCommand;
}