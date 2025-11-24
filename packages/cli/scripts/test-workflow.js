#!/usr/bin/env node

/**
 * Test Workflow Script
 *
 * Builds, links, and tests the Grok One Shot workflow features with proper argument passing.
 * Usage: npm run test:workflow "your task description"
 * Example: npm run test:workflow "add a hello world function"
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  console.log('🚀 Test workflow script starting...');
  console.log('Arguments received:', process.argv);

  // Get the task description from command line arguments
  const args = process.argv.slice(2);
  const taskDescription = args.join(' ');

  console.log('Task description:', taskDescription || '(empty)');

  if (!taskDescription) {
    console.log('❌ Usage: npm run test:workflow "your task description"');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test:workflow "add a hello world function"');
    console.log('  npm run test:workflow "implement user authentication"');
    console.log('  npm run test:workflow --headless "add error handling"');
    console.log('');
    console.log('Make sure to set your API key:');
    console.log('  export X_API_KEY=your_grok_api_key_here');
    process.exit(1);
  }

  console.log('🔨 Building Grok One Shot...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }

  console.log('🔗 Linking globally...');
  try {
    execSync('npm link', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Link failed:', error.message);
    process.exit(1);
  }

  console.log('🧪 Testing workflow with task:', taskDescription);
  console.log('=' .repeat(60));

  // Check if API key is set
  const apiKey = process.env.X_API_KEY;
  if (!apiKey) {
    console.log('⚠️  Warning: X_API_KEY environment variable not set');
    console.log('   Set it with: export X_API_KEY=your_grok_api_key_here');
    console.log('');
  }

  try {
    // Run the CLI with the task description
    const cliCommand = `node ${path.join(__dirname, '..', 'dist', 'index.js')} "${taskDescription}"`;
    execSync(cliCommand, { stdio: 'inherit', env: process.env });
  } catch (error) {
    console.log('');
    console.log('ℹ️  Command completed (exit code:', error.status || 'unknown', ')');
    console.log('');

    if (error.status === 130) {
      console.log('💡 Tip: If you canceled with Ctrl+C, try running again or use --headless mode');
    }

    // Don't exit with error - the command may have completed successfully
    // (e.g., if user chose to reject a plan)
  }

  console.log('');
  console.log('📁 Check results:');
  console.log('  Documentation: ls .agent/tasks/ | tail -1');
  console.log('  Patches: ls ~/.xcli/patches/ 2>/dev/null || echo "No patches found"');
  console.log('  Git status: git status --porcelain');
}

main();