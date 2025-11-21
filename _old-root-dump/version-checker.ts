import pkg from "../../package.json" with { type: "json" };
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface VersionInfo {
  current: string;
  latest: string;
  isUpdateAvailable: boolean;
  updateCommand: string;
}

/**
 * Check if a new version is available on npm
 */
export async function checkForUpdates(): Promise<VersionInfo> {
  try {
    const { stdout } = await execAsync(`npm view ${pkg.name} version`, {
      timeout: 5000,
    });
    
    const latestVersion = stdout.trim();
    const currentVersion = pkg.version;
    
    // Compare versions using simple string comparison
    // For semantic versioning: 1.0.1 vs 1.0.2
    const isUpdateAvailable = latestVersion !== currentVersion && 
                               isNewerVersion(latestVersion, currentVersion);
    
    return {
      current: currentVersion,
      latest: latestVersion,
      isUpdateAvailable,
      updateCommand: `npm update -g ${pkg.name}@latest`,
    };
  } catch {
    // Silently fail - network issues shouldn't block startup
    return {
      current: pkg.version,
      latest: pkg.version,
      isUpdateAvailable: false,
      updateCommand: `npm update -g ${pkg.name}@latest`,
    };
  }
}

/**
 * Simple semantic version comparison
 * Returns true if version1 is newer than version2
 */
function isNewerVersion(version1: string, version2: string): boolean {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return true;
    if (v1Part < v2Part) return false;
  }
  
  return false;
}

/**
 * Auto-upgrade if user confirms
 */
export async function autoUpgrade(): Promise<boolean> {
  try {
    console.log("🔄 Upgrading X-CLI...");
    await execAsync(`npm update -g ${pkg.name}@latest`, {
      timeout: 30000,
    });
    console.log("✅ Upgrade completed! Please restart the CLI.");
    return true;
  } catch (error) {
    console.error("❌ Auto-upgrade failed:", error);
    return false;
  }
}

/**
 * Get cached version check result (for periodic checks)
 */
let cachedVersionInfo: VersionInfo | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

export async function getCachedVersionInfo(): Promise<VersionInfo | null> {
  const now = Date.now();
  
  if (cachedVersionInfo && (now - lastCheckTime) < CHECK_INTERVAL) {
    return cachedVersionInfo;
  }
  
  try {
    cachedVersionInfo = await checkForUpdates();
    lastCheckTime = now;
    return cachedVersionInfo;
  } catch {
    return null;
  }
}