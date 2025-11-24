// scripts/local.js - Fixed local development startup script with logging
// Run with: npm run local

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../logs/startup.log');

// Logging function with timestamp (moved to top for early errors)
const log = async (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  // Console output (always)
  console.log(`\n🔍 [${level}] ${message}`);
  
  // File output (try-catch for permissions)
  try {
    const logDir = path.dirname(logFile);
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(logFile, logEntry);
  } catch (error) {
    console.warn(`⚠️  Could not write to log file: ${error.message}`);
  }
};

// Early error logging before main()
process.on('uncaughtException', async (error) => {
  await log(`💥 Uncaught exception: ${error.message}`, 'FATAL');
  await log(`   Stack: ${error.stack}`, 'FATAL');
  process.exit(1);
});

async function buildIfNeeded() {
  try {
    await log('🔨 Checking if build is needed (dist/ directory)');
    const distPath = path.join(process.cwd(), 'dist');
    try {
      await fs.access(distPath);
      await log('   dist/ directory exists - skipping build');
      return true;
    } catch {
      await log('   dist/ directory missing - running build');
      execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
      await log('   Build completed successfully');
      return true;
    }
  } catch (error) {
    await log(`   Build failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function startCLI() {
  try {
    await log('📦 Attempting to start CLI using standard Node execution');
    
    // Try standard CLI execution via package.json bin or main
    const pkg = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8');
    const packageData = JSON.parse(pkg);
    
    if (packageData.bin && packageData.bin['grok-one-shot']) {
      await log(`   Using bin script: ${packageData.bin['grok-one-shot']}`);
      // Execute via npx-like pattern for local bin
      execSync('node dist/index.js', { stdio: 'inherit', cwd: process.cwd() });
    } else if (packageData.main) {
      await log(`   Using main entry: ${packageData.main}`);
      // Direct import and execution
      const mainPath = path.join(process.cwd(), packageData.main);
      const { default: cliMain, main: cliEntry } = await import(mainPath);
      const entry = cliMain || cliEntry || cliMain;
      if (typeof entry === 'function') {
        await log('   Executing main function');
        await entry();
      } else {
        await log('   Starting CLI module directly');
        // For modules that use process.argv directly
        process.argv = ['node', 'grok-one-shot']; // Reset args for CLI mode
        await import(mainPath);
      }
    } else {
      throw new Error('No bin or main entry found in package.json');
    }
    
    await log('✅ CLI started successfully');
  } catch (error) {
    await log(`💥 CLI execution failed: ${error.message}`, 'ERROR');
    await log(`   Stack: ${error.stack}`, 'ERROR');
    throw error;
  }
}

async function main() {
  try {
    // Initialize logging directory immediately
    const logDir = path.dirname(logFile);
    await fs.mkdir(logDir, { recursive: true });
    
    await log('🚀 Starting Grok One Shot local development mode (FIXED VERSION)');
    
    // Phase 1: Environment check
    await log('📋 Checking Node.js environment');
    await log(`   Node version: ${process.version}`);
    await log(`   Platform: ${process.platform}`);
    await log(`   Working dir: ${process.cwd()}`);
    await log(`   Arguments: ${process.argv.slice(2).join(' ')}`);
    
    // Phase 2: Load configuration
    await log('⚙️  Loading configuration and dependencies');
    const configPath = path.join(process.cwd(), '.grok/settings.json');
    try {
      const config = await fs.readFile(configPath, 'utf8');
      await log(`   Config loaded: ${config.length} bytes`);
    } catch (error) {
      await log(`   Config not found (normal for first run): ${error.message}`, 'WARN');
    }
    
    // Phase 3: Build if needed
    await log('🏗️  Preparing build artifacts');
    const buildSuccess = await buildIfNeeded();
    if (!buildSuccess) {
      throw new Error('Build process failed');
    }
    
    // Phase 4: Start CLI
    await log('🎯 Starting CLI interactive mode');
    try {
  // Simple direct execution for interactive CLI
// Simple direct execution - run the CLI and let it handle its own process
await log('🚀 Launching Grok One Shot interactive mode');
console.log('\n' + '='.repeat(60));
console.log('🤖 Grok One Shot LOCAL DEVELOPMENT MODE');
console.log('='.repeat(60));
console.log('📝 Logging enabled - check logs/startup.log for details');
console.log('🔑 API Key: Set GROK_API_KEY for full AI functionality');
console.log('❓ Type "help" for commands or start chatting!');
console.log('='.repeat(60) + '\n');

// Handle API key for CLI startup
const apiKey = process.env.GROK_API_KEY;
if (!apiKey) {
  console.log('\n⚠️  WARNING: GROK_API_KEY not set - AI features will be limited');
  console.log('   Set with: export GROK_API_KEY="gsk_your_key_here"');
  console.log('   Or add to .grok/settings.json\n');
}

// Launch CLI with proper environment
const { spawn } = await import('child_process');
const cliProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    GROK_API_KEY: apiKey || '',
    XCLI_LOGGING: 'true'
  }
});

await log('🚀 Grok One Shot interactive mode launched');
await log('✅ Startup logging completed - CLI is running');

// Wait for CLI process to complete
await new Promise((resolve, reject) => {
  cliProcess.on('close', (code) => {
    log(`CLI process exited with code ${code}`);
    resolve(code);
  });
  
  cliProcess.on('error', (error) => {
    log(`CLI spawn error: ${error.message}`, 'ERROR');
    reject(error);
  });
});
  // Keep process running for interactive CLI
  process.stdin.resume();
  await new Promise(() => {});
} catch (error) {
  console.error('CLI execution error:', error.message);
  process.exit(1);
}
    
    await log('✅ Grok One Shot local startup completed successfully');
  } catch (error) {
    await log(`💥 Startup failed: ${error.message}`, 'ERROR');
    await log(`   Stack: ${error.stack}`, 'ERROR');
    process.exit(1);
  }
}

// Run the startup
main().catch(async (error) => {
  // Emergency logging if main logging failed
  try {
    const logDir = path.dirname(logFile);
    await fs.mkdir(logDir, { recursive: true });
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [FATAL] Unhandled startup error: ${error.message}\n[${timestamp}] [FATAL] Stack: ${error.stack}\n`;
    await fs.appendFile(logFile, logEntry);
    console.error(`\n💥 FATAL ERROR: ${error.message}`);
  } catch {
    console.error(`\n💥 FATAL ERROR (logging failed): ${error.message}`);
  }
  process.exit(1);
});
