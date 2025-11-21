import { Command } from 'commander';
import { getSettingsManager } from '../utils/settings-manager.js';
import chalk from 'chalk';

export function createToggleConfirmationsCommand(): Command {
  const toggleCommand = new Command('toggle-confirmations');
  toggleCommand
    .description('Toggle the requirement for user confirmation on file operations and bash commands')
    .action(async () => {
      try {
        const settingsManager = getSettingsManager();
        const currentValue = settingsManager.getUserSetting('requireConfirmation') ?? true;
        const newValue = !currentValue;
        settingsManager.updateUserSetting('requireConfirmation', newValue);
        console.log(chalk.green(`✅ Confirmation requirement ${newValue ? 'enabled' : 'disabled'}`));
        console.log(`File operations and bash commands will ${newValue ? 'now' : 'no longer'} require confirmation.`);
      } catch (error: any) {
        console.error(chalk.red(`❌ Failed to toggle confirmations: ${error.message}`));
        process.exit(1);
      }
    });

  return toggleCommand;
}