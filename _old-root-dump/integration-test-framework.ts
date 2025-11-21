/**
 * Integration Test Framework
 *
 * Comprehensive testing framework for the autonomous task system,
 * including end-to-end tests, performance benchmarking, and regression testing.
 */

import { AutonomousExecutor } from './autonomous-executor.js';
import { AgentFramework } from './agent-framework.js';
import { EnhancedErrorHandler } from './enhanced-error-handler.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  goal: string;
  expectedOutcome: 'success' | 'failure' | 'partial';
  timeout: number;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  validation?: (result: any) => Promise<boolean>;
  tags: string[];
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: string;
  output?: any;
  metrics: TestMetrics;
  timestamp: number;
}

export interface TestMetrics {
  stepsExecuted: number;
  filesModified: number;
  memoryUsage: number;
  cpuTime: number;
  apiCalls: number;
  errorCount: number;
}

export interface BenchmarkResult {
  operation: string;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  throughput: number;
  memoryUsage: number;
  samples: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface RegressionReport {
  baselineCommit: string;
  currentCommit: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  newFailures: string[];
  fixedTests: string[];
  performanceDegradations: PerformanceRegression[];
  timestamp: number;
}

export interface PerformanceRegression {
  testId: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  degradationPercent: number;
}

/**
 * Integration Test Framework for autonomous task system
 */
export class IntegrationTestFramework {
  private autonomousExecutor: AutonomousExecutor;
  private agentFramework: AgentFramework;
  private errorHandler: EnhancedErrorHandler;
  private testResults: TestResult[] = [];
  private benchmarkResults: Map<string, BenchmarkResult> = new Map();
  private testSuites: TestSuite[] = [];

  constructor() {
    this.autonomousExecutor = new AutonomousExecutor();
    this.agentFramework = new AgentFramework(this.autonomousExecutor);
    this.errorHandler = new EnhancedErrorHandler();
  }

  /**
   * Initialize the test framework
   */
  async initialize(): Promise<void> {
    await this.agentFramework.initialize();
    await this.loadTestSuites();
    console.log(`🧪 Integration Test Framework initialized with ${this.testSuites.length} test suites`);
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting integration test execution...');

    const allResults: TestResult[] = [];

    for (const suite of this.testSuites) {
      console.log(`📋 Running test suite: ${suite.name}`);
      const suiteResults = await this.runTestSuite(suite);
      allResults.push(...suiteResults);
    }

    this.testResults = allResults;
    await this.generateTestReport(allResults);

    console.log(`✅ Test execution completed. ${allResults.filter(r => r.status === 'passed').length}/${allResults.length} tests passed.`);
    return allResults;
  }

  /**
   * Run performance benchmarks
   */
  async runBenchmarks(iterations: number = 10): Promise<Map<string, BenchmarkResult>> {
    console.log('📊 Starting performance benchmarks...');

    const benchmarks = [
      { name: 'simple_task', goal: 'Create a simple test file with "Hello World"' },
      { name: 'complex_task', goal: 'Refactor a React component to use hooks' },
      { name: 'error_recovery', goal: 'Handle a syntax error and recover automatically' },
      { name: 'multi_file', goal: 'Update multiple files with consistent changes' }
    ];

    for (const benchmark of benchmarks) {
      const durations: number[] = [];
      const memoryUsages: number[] = [];

      for (let i = 0; i < iterations; i++) {
        console.log(`🔄 Benchmark iteration ${i + 1}/${iterations} for ${benchmark.name}`);

        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage().heapUsed;

        try {
          const result = await this.autonomousExecutor.executeTask(benchmark.goal, '');
          if (result.status === 'completed') {
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage().heapUsed;

            const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
            const memoryUsage = endMemory - startMemory;

            durations.push(duration);
            memoryUsages.push(memoryUsage);
          }
        } catch (error) {
          console.warn(`Benchmark iteration failed:`, error);
        }

        // Cleanup delay
        await this.delay(1000);
      }

      if (durations.length > 0) {
        const benchmarkResult: BenchmarkResult = {
          operation: benchmark.name,
          averageDuration: durations.reduce((a, b) => a + b) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          p95Duration: this.calculatePercentile(durations, 95),
          throughput: 1000 / (durations.reduce((a, b) => a + b) / durations.length), // ops per second
          memoryUsage: memoryUsages.reduce((a, b) => a + b) / memoryUsages.length,
          samples: durations.length
        };

        this.benchmarkResults.set(benchmark.name, benchmarkResult);
        console.log(`📈 ${benchmark.name}: ${benchmarkResult.averageDuration.toFixed(2)}ms avg, ${benchmarkResult.throughput.toFixed(2)} ops/sec`);
      }
    }

    await this.saveBenchmarkResults();
    return this.benchmarkResults;
  }

  /**
   * Run regression tests against baseline
   */
  async runRegressionTests(baselineResultsPath?: string): Promise<RegressionReport> {
    console.log('🔄 Running regression tests...');

    const currentResults = await this.runAllTests();
    const baselinePath = baselineResultsPath || path.join(process.cwd(), '.test-baseline', 'results.json');

    let baselineResults: TestResult[] = [];
    try {
      const baselineContent = await fs.readFile(baselinePath, 'utf-8');
      baselineResults = JSON.parse(baselineContent);
    } catch {
      console.warn('No baseline results found, creating new baseline');
    }

    const report = this.generateRegressionReport(currentResults, baselineResults);
    await this.saveRegressionReport(report);

    console.log(`📊 Regression report: ${report.passedTests}/${report.totalTests} tests passed`);
    if (report.newFailures.length > 0) {
      console.warn(`❌ New failures: ${report.newFailures.join(', ')}`);
    }
    if (report.fixedTests.length > 0) {
      console.log(`✅ Fixed tests: ${report.fixedTests.join(', ')}`);
    }

    return report;
  }

  /**
   * Add a custom test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.testSuites.push(suite);
  }

  /**
   * Create a test case
   */
  createTestCase(testCase: Omit<TestCase, 'id'>): TestCase {
    return {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...testCase
    };
  }

  /**
   * Run a single test suite
   */
  private async runTestSuite(suite: TestSuite): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Run suite setup
    if (suite.setup) {
      try {
        await suite.setup();
      } catch (error) {
        console.error(`Suite setup failed for ${suite.name}:`, error);
        return results;
      }
    }

    for (const test of suite.tests) {
      const result = await this.runTestCase(test);
      results.push(result);
    }

    // Run suite teardown
    if (suite.teardown) {
      try {
        await suite.teardown();
      } catch (error) {
        console.error(`Suite teardown failed for ${suite.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Run a single test case
   */
  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    console.log(`🧪 Running test: ${testCase.name}`);

    let status: TestResult['status'] = 'passed';
    let error: string | undefined;
    let output: any;

    try {
      // Run test setup
      if (testCase.setup) {
        await testCase.setup();
      }

      // Execute the test
      const result = await this.agentFramework.executeInSession(
        'test_session',
        testCase.goal,
        { description: testCase.description }
      );

      output = result;

      // Validate result
      if (testCase.validation) {
        const isValid = await testCase.validation(result);
        if (!isValid) {
          status = 'failed';
          error = 'Validation failed';
        }
      } else {
        // Default validation based on expected outcome
        const actualOutcome = result.status === 'completed' ? 'success' :
                            result.status === 'failed' ? 'failure' : 'partial';

        if (actualOutcome !== testCase.expectedOutcome) {
          status = 'failed';
          error = `Expected ${testCase.expectedOutcome}, got ${actualOutcome}`;
        }
      }

      // Learn from test execution
      await this.agentFramework.learnFromInteraction('test_session', {
        goal: testCase.goal,
        description: testCase.description,
        outcome: status === 'passed' ? 'success' : 'failure',
        result
      });

    } catch (testError) {
      status = 'error';
      error = testError instanceof Error ? testError.message : String(testError);
      console.error(`Test error in ${testCase.name}:`, testError);
    } finally {
      // Run test teardown
      if (testCase.teardown) {
        try {
          await testCase.teardown();
        } catch (teardownError) {
          console.error(`Test teardown failed for ${testCase.name}:`, teardownError);
        }
      }
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    const metrics: TestMetrics = {
      stepsExecuted: output?.steps?.length || 0,
      filesModified: output?.context?.affectedFiles?.length || 0,
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      cpuTime: endTime - startTime,
      apiCalls: 0, // Would need to be tracked separately
      errorCount: status === 'passed' ? 0 : 1
    };

    const result: TestResult = {
      testId: testCase.id,
      status,
      duration: endTime - startTime,
      error,
      output,
      metrics,
      timestamp: Date.now()
    };

    console.log(`${status === 'passed' ? '✅' : '❌'} Test ${testCase.name}: ${status} (${result.duration}ms)`);

    return result;
  }

  /**
   * Load predefined test suites
   */
  private async loadTestSuites(): Promise<void> {
    // Basic functionality tests
    const basicTests: TestSuite = {
      id: 'basic_functionality',
      name: 'Basic Functionality Tests',
      description: 'Tests core autonomous task functionality',
      tests: [
        {
          id: 'simple_file_creation',
          name: 'Simple File Creation',
          description: 'Test creating a simple file',
          goal: 'Create a file named test.txt with content "Hello World"',
          expectedOutcome: 'success',
          timeout: 30000,
          tags: ['basic', 'file_operations'],
          validation: async (result) => {
            if (result.status !== 'completed') return false;
            try {
              const content = await fs.readFile('test.txt', 'utf-8');
              return content === 'Hello World';
            } catch {
              return false;
            }
          },
          teardown: async () => {
            try {
              await fs.unlink('test.txt');
            } catch {
              // Ignore errors if file doesn't exist
            }
          }
        },
        {
          id: 'error_recovery_test',
          name: 'Error Recovery Test',
          description: 'Test error handling and recovery',
          goal: 'Try to read a non-existent file and handle the error gracefully',
          expectedOutcome: 'failure',
          timeout: 30000,
          tags: ['error_handling', 'recovery'],
          validation: async (result) => {
            // Should fail gracefully with error analysis
            return result.status === 'failed' && result.context?.errorAnalysis;
          }
        }
      ]
    };

    // Advanced functionality tests
    const advancedTests: TestSuite = {
      id: 'advanced_functionality',
      name: 'Advanced Functionality Tests',
      description: 'Tests advanced features like planning and agent memory',
      tests: [
        {
          id: 'complex_planning',
          name: 'Complex Task Planning',
          description: 'Test complex task decomposition and planning',
          goal: 'Create a complete user authentication system with login, register, and password reset',
          expectedOutcome: 'partial', // May not fully complete in test environment
          timeout: 120000,
          tags: ['planning', 'complex'],
          validation: async (result) => {
            // Should create multiple files and show planning steps
            return result.steps && result.steps.length > 3;
          }
        },
        {
          id: 'agent_memory_test',
          name: 'Agent Memory Test',
          description: 'Test agent learning and memory',
          goal: 'Remember that I prefer TypeScript over JavaScript and use it for future implementations',
          expectedOutcome: 'success',
          timeout: 30000,
          tags: ['memory', 'learning']
        }
      ]
    };

    // Performance tests
    const performanceTests: TestSuite = {
      id: 'performance_tests',
      name: 'Performance Tests',
      description: 'Tests system performance under various loads',
      tests: [
        {
          id: 'concurrent_tasks',
          name: 'Concurrent Task Execution',
          description: 'Test handling multiple concurrent tasks',
          goal: 'Execute 3 simple file creation tasks simultaneously',
          expectedOutcome: 'success',
          timeout: 60000,
          tags: ['performance', 'concurrency']
        }
      ]
    };

    this.testSuites = [basicTests, advancedTests, performanceTests];
  }

  /**
   * Generate comprehensive test report
   */
  private async generateTestReport(results: TestResult[]): Promise<void> {
    const report = {
      timestamp: Date.now(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        errors: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length
      },
      results,
      metrics: {
        averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        totalMemoryUsage: results.reduce((sum, r) => sum + r.metrics.memoryUsage, 0),
        totalStepsExecuted: results.reduce((sum, r) => sum + r.metrics.stepsExecuted, 0)
      }
    };

    const reportPath = path.join(process.cwd(), 'test-results', `report_${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Test report saved to: ${reportPath}`);
  }

  /**
   * Generate regression report
   */
  private generateRegressionReport(currentResults: TestResult[], baselineResults: TestResult[]): RegressionReport {
    const currentMap = new Map(currentResults.map(r => [r.testId, r]));
    const baselineMap = new Map(baselineResults.map(r => [r.testId, r]));

    const newFailures: string[] = [];
    const fixedTests: string[] = [];
    const performanceDegradations: PerformanceRegression[] = [];

    for (const [testId, currentResult] of currentMap) {
      const baselineResult = baselineMap.get(testId);

      if (!baselineResult) {
        // New test
        continue;
      }

      // Check for status regressions
      if (baselineResult.status === 'passed' && currentResult.status !== 'passed') {
        newFailures.push(testId);
      } else if (baselineResult.status !== 'passed' && currentResult.status === 'passed') {
        fixedTests.push(testId);
      }

      // Check for performance regressions
      if (currentResult.duration > baselineResult.duration * 1.5) { // 50% degradation
        performanceDegradations.push({
          testId,
          metric: 'duration',
          baselineValue: baselineResult.duration,
          currentValue: currentResult.duration,
          degradationPercent: ((currentResult.duration - baselineResult.duration) / baselineResult.duration) * 100
        });
      }
    }

    return {
      baselineCommit: 'unknown', // Would need git integration
      currentCommit: 'unknown',
      totalTests: currentResults.length,
      passedTests: currentResults.filter(r => r.status === 'passed').length,
      failedTests: currentResults.filter(r => r.status !== 'passed').length,
      newFailures,
      fixedTests,
      performanceDegradations,
      timestamp: Date.now()
    };
  }

  /**
   * Save benchmark results
   */
  private async saveBenchmarkResults(): Promise<void> {
    const resultsPath = path.join(process.cwd(), 'benchmarks', `results_${Date.now()}.json`);
    await fs.mkdir(path.dirname(resultsPath), { recursive: true });

    const results = Object.fromEntries(this.benchmarkResults);
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    console.log(`📊 Benchmark results saved to: ${resultsPath}`);
  }

  /**
   * Save regression report
   */
  private async saveRegressionReport(report: RegressionReport): Promise<void> {
    const reportPath = path.join(process.cwd(), 'regressions', `report_${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`🔄 Regression report saved to: ${reportPath}`);
  }

  /**
   * Calculate percentile from array
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}