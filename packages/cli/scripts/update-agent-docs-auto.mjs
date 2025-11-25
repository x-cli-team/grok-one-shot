#!/usr/bin/env node

/**
 * Automatic .agent documentation updater for git hooks
 * Intelligently updates documentation only when meaningful changes are detected
 */

try {
  const { UpdateAgentDocs } = await import('../src/tools/documentation/update-agent-docs.ts');
  
  const updater = new UpdateAgentDocs({
    rootPath: '.',
    updateTarget: 'all',
    autoCommit: false
  });
  
  const result = await updater.updateDocs();
  console.log('📝', result.message);
  
  if (result.updatedFiles.length > 0) {
    console.log('📝 Updated files:', result.updatedFiles.join(', '));
  }
  
  if (result.suggestions.length > 0) {
    console.log('💡 Suggestions:', result.suggestions.join(', '));
  }
  
} catch (error) {
  console.log('⚠️ Docs update skipped:', error.message);
  // Don't exit with error - graceful degradation for git hooks
  process.exit(0);
}