import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Check if pro features are enabled
 * Priority: environment variable > config file > pro package installed
 */
export function isProEnabled(): boolean {
  // Check environment variable first
  if (process.env.GROK_ONE_SHOT_PRO === 'true') {
    return true;
  }

  // Check config file
  try {
    const configPath = join(process.cwd(), '.grok-one-shot.json');
    if (existsSync(configPath)) {
      const config = require(configPath);
      if (config.pro === true) {
        return true;
      }
    }
  } catch (error) {
    // Ignore config read errors
  }

  // Check if pro package is installed
  try {
    require.resolve('@grok-one-shot/pro');
    return true;
  } catch (error) {
    // Pro package not found
  }

  return false;
}

/**
 * Get pro status with details
 */
export function getProStatus(): { enabled: boolean; reason: string } {
  if (process.env.GROK_ONE_SHOT_PRO === 'true') {
    return { enabled: true, reason: 'environment variable' };
  }

  try {
    const configPath = join(process.cwd(), '.grok-one-shot.json');
    if (existsSync(configPath)) {
      const config = require(configPath);
      if (config.pro === true) {
        return { enabled: true, reason: 'config file' };
      }
    }
  } catch (error) {
    // Ignore
  }

  try {
    require.resolve('@grok-one-shot/pro');
    return { enabled: true, reason: 'pro package installed' };
  } catch (error) {
    return { enabled: false, reason: 'pro package not installed' };
  }
}