#!/usr/bin/env bun

// Agent self-testing script for iterative improvements
// This allows the AI agent to test itself and iterate on fixes

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const TEST_CASES = [
  "project summary",
  "list files in src/",
  "explain the architecture", 
  "what are the key features?",
  "check for TODO comments"
];

class AgentTester {
  constructor() {
    this.testResults = [];
    this.logDir = './agent-test-logs';
  }

  async runTest(prompt, iteration = 1) {
    console.log(`\n🧪 Test ${iteration}: "${prompt}"`);
    
    try {
      // Build first
      execSync('bun run build', { stdio: 'pipe' });
      
      // Run test
      const timestamp = Date.now();
      const logFile = `agent-test-${timestamp}.log`;
      
      const output = execSync(`./dist/index.js -p "${prompt}"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Write log
      writeFileSync(logFile, output);
      
      // Analyze output
      const analysis = this.analyzeOutput(output, prompt);
      
      console.log(`📊 Result: ${analysis.status}`);
      if (analysis.issues.length > 0) {
        console.log(`⚠️  Issues found: ${analysis.issues.join(', ')}`);
      }
      
      return {
        prompt,
        iteration,
        logFile,
        output: output.split('\n').slice(-20).join('\n'), // Last 20 lines
        analysis,
        timestamp
      };
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      return {
        prompt,
        iteration,
        error: error.message,
        analysis: { status: 'FAILED', issues: ['Test execution failed'] }
      };
    }
  }

  analyzeOutput(output, prompt) {
    const issues = [];
    let status = 'PASSED';
    
    // Check for isolated dots
    if (output.includes('⏺\n') || output.match(/⏺\s*\n\s*⏺/)) {
      issues.push('Isolated dots found');
      status = 'ISSUES';
    }
    
    // Check for errors
    if (output.match(/ERROR|Error|error.*failed/i)) {
      issues.push('Errors in output');
      status = 'FAILED';
    }
    
    // Check for empty responses
    const cleanOutput = output.replace(/\[[0-9-:TZ\.]+\]/g, '').trim();
    if (cleanOutput.length < 50) {
      issues.push('Response too short');
      status = 'ISSUES';
    }
    
    // Check for good formatting
    const hasHeaders = output.match(/^[A-Z][a-z\s]+$/m);
    const hasEmojis = output.match(/[✅❌⚠️💡🔍📋📊🛠️🚀]/);
    const hasSections = output.match(/Overview|Features|Tech Stack|Structure/);
    
    if (!hasHeaders || !hasSections) {
      issues.push('Poor formatting');
      status = status === 'PASSED' ? 'ISSUES' : status;
    }
    
    return { status, issues, hasEmojis: !!hasEmojis };
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      passed: this.testResults.filter(r => r.analysis?.status === 'PASSED').length,
      issues: this.testResults.filter(r => r.analysis?.status === 'ISSUES').length,
      failed: this.testResults.filter(r => r.analysis?.status === 'FAILED').length,
      results: this.testResults
    };
    
    const reportFile = `agent-test-report-${Date.now()}.json`;
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Test Report Generated: ${reportFile}`);
    console.log(`✅ Passed: ${report.passed}/${report.totalTests}`);
    console.log(`⚠️  Issues: ${report.issues}/${report.totalTests}`);
    console.log(`❌ Failed: ${report.failed}/${report.totalTests}`);
    
    return report;
  }
}

// Main execution
async function main() {
  const tester = new AgentTester();
  
  console.log('🤖 Starting Agent Self-Test Suite');
  console.log(`📋 Running ${TEST_CASES.length} test cases`);
  
  for (const testCase of TEST_CASES) {
    const result = await tester.runTest(testCase);
    tester.testResults.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const report = tester.generateReport();
  
  console.log('\n🏁 Testing complete!');
  console.log('💡 Use this data to identify patterns and improvements');
}

if (import.meta.main) {
  main().catch(console.error);
}