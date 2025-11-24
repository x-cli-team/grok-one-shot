/**
 * Auto-Doc Generator Service
 *
 * Automatically generates completion documentation for .agent/tasks/
 * and optionally updates SOP files with learned lessons.
 */

import { ResearchOutput, ResearchRequest } from '../types/research-recommend.js';
import { ExecutionResult } from '../types/execution.js';
import * as fs from 'fs';
import * as path from 'path';

export interface CompletionMetadata {
  timestamp: Date;
  userRequest: ResearchRequest;
  researchOutput: ResearchOutput;
  executionResult: ExecutionResult;
  duration: number;
  success: boolean;
  lessonsLearned?: string[];
  sopCandidates?: string[];
}

export interface AutoDocOptions {
  includeDiffs: boolean;
  includeLessons: boolean;
  updateSOPs: boolean;
  maxFileSize: number;
}

const DEFAULT_OPTIONS: AutoDocOptions = {
  includeDiffs: true,
  includeLessons: true,
  updateSOPs: false,
  maxFileSize: 1024 * 1024 // 1MB
};

export class AutoDocGenerator {
  private options: AutoDocOptions;

  constructor(options: Partial<AutoDocOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate completion documentation
   */
  async generateCompletionDoc(metadata: CompletionMetadata): Promise<string> {
    const { timestamp, userRequest, researchOutput, executionResult, duration, success, lessonsLearned } = metadata;

    const dateStr = timestamp.toISOString().split('T')[0];
    const slug = this.generateSlug(userRequest.userTask);
    const _filename = `${dateStr}-${slug}.md`; // Prefix with underscore for unused variable

    const content = `# ${userRequest.userTask}

**Status:** ${success ? '✅ Completed' : '❌ Completed with Issues'}
**Date:** ${timestamp.toISOString()}
**Duration:** ${Math.round(duration / 1000)}s
**Success Rate:** ${executionResult.executionPlan.completedSteps}/${executionResult.executionPlan.totalSteps} steps

## Original Request
${userRequest.userTask}

${userRequest.constraints && userRequest.constraints.length > 0 ? `## Constraints\n${userRequest.constraints.map(c => `- ${c}`).join('\n')}\n` : ''}

${userRequest.preferences && userRequest.preferences.length > 0 ? `## Preferences\n${userRequest.preferences.map(p => `- ${p}`).join('\n')}\n` : ''}

## Research Analysis

### Issues Identified
${researchOutput.issues.map(issue => `- **${issue.type.toUpperCase()}** (${issue.severity}): ${issue.description}${issue.impact ? `\n  *Impact: ${issue.impact}*` : ''}`).join('\n')}

### Options Considered
${researchOutput.options.map(option =>
  `1. **${option.title}**\n   - ${option.description}\n   - Effort: ${option.effort.toUpperCase()} | Risk: ${option.risk.toUpperCase()}\n   - Pros: ${option.tradeoffs.pros.join(', ')}\n   - Cons: ${option.tradeoffs.cons.join(', ')}`
).join('\n\n')}

### Recommendation
**${researchOutput.recommendation.optionId}. ${researchOutput.options.find(o => o.id === researchOutput.recommendation.optionId)?.title}**
- Confidence: ${researchOutput.recommendation.confidence.toUpperCase()}
- Reasoning: ${researchOutput.recommendation.reasoning}
- Justification: ${researchOutput.recommendation.justification}

## Execution Plan
${researchOutput.plan.summary}

### Approach
${researchOutput.plan.approach.map((step, i) => `${i + 1}. ${step}`).join('\n')}

### TODO Items
${researchOutput.plan.todo.map((item, i) => `${i + 1}. [${executionResult.executionPlan.steps[i]?.status === 'completed' ? 'x' : ' '}] ${item}`).join('\n')}

${researchOutput.plan.keyConsiderations.length > 0 ? `### Key Considerations\n${researchOutput.plan.keyConsiderations.map(c => `- ${c}`).join('\n')}\n` : ''}

## Execution Results

### Summary
- **Total Steps:** ${executionResult.executionPlan.totalSteps}
- **Completed:** ${executionResult.executionPlan.completedSteps}
- **Failed:** ${executionResult.executionPlan.failedSteps}
- **Start Time:** ${executionResult.executionPlan.startTime.toISOString()}
- **End Time:** ${executionResult.executionPlan.endTime?.toISOString() || 'N/A'}
- **Git Commit:** ${executionResult.executionPlan.gitCommitHash ? executionResult.executionPlan.gitCommitHash.substring(0, 8) : 'None'}

### Step Details
${executionResult.executionPlan.steps.map(step => {
  const statusIcon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
  let details = `${statusIcon} **Step ${step.id}:** ${step.description}\n`;

  if (step.changes && step.changes.length > 0) {
    details += `   - Files changed: ${step.changes.length}\n`;
    step.changes.slice(0, 3).forEach(change => {
      details += `   - ${change.changeType.toUpperCase()}: ${change.filePath}\n`;
    });
    if (step.changes.length > 3) {
      details += `   - ... and ${step.changes.length - 3} more\n`;
    }
  }

  if (step.patchFile) {
    details += `   - Patch: ${step.patchFile}\n`;
  }

  if (step.error) {
    details += `   - Error: ${step.error}\n`;
  }

  return details;
}).join('\n')}

${lessonsLearned && lessonsLearned.length > 0 ? `## Lessons Learned\n${lessonsLearned.map(lesson => `- ${lesson}`).join('\n')}\n` : ''}

---

*Auto-generated by grok-one-shot on ${timestamp.toISOString()}*`;

    // Ensure content doesn't exceed max file size
    const contentBytes = Buffer.byteLength(content, 'utf-8');
    if (contentBytes > this.options.maxFileSize) {
      const truncated = content.substring(0, this.options.maxFileSize - 100) + '\n\n[...content truncated due to size...]\n';
      return truncated;
    }

    return content;
  }

  /**
   * Save completion documentation to .agent/tasks/
   */
  async saveCompletionDoc(metadata: CompletionMetadata): Promise<string> {
    const content = await this.generateCompletionDoc(metadata);

    const tasksDir = path.join('.agent', 'tasks');
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }

    const dateStr = metadata.timestamp.toISOString().split('T')[0];
    const slug = this.generateSlug(metadata.userRequest.userTask);
    const filename = `${dateStr}-${slug}.md`;
    const filepath = path.join(tasksDir, filename);

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`📝 Completion documentation saved: .agent/tasks/${filename}`);

    return filepath;
  }

  /**
   * Analyze execution for lessons learned
   */
  analyzeLessons(metadata: CompletionMetadata): string[] {
    const lessons: string[] = [];

    const { executionResult, researchOutput } = metadata;
    const plan = executionResult.executionPlan;

    // Analyze success patterns
    if (plan.failedSteps === 0) {
      lessons.push('All execution steps completed successfully - workflow validation confirmed');
    } else {
      lessons.push(`${plan.failedSteps} steps failed - consider improving error handling for similar tasks`);
    }

    // Analyze recovery usage
    const recoverySteps = plan.steps.filter(step => step.description.includes('[RECOVERY]')).length;
    if (recoverySteps > 0) {
      lessons.push(`${recoverySteps} recovery steps were needed - adaptive recovery proved valuable`);
    }

    // Analyze option selection
    const selectedOption = researchOutput.options.find(o => o.id === researchOutput.recommendation.optionId);
    if (selectedOption && plan.failedSteps === 0) {
      lessons.push(`Selected option "${selectedOption.title}" (${selectedOption.effort} effort, ${selectedOption.risk} risk) was successful`);
    }

    // Analyze duration
    const avgStepDuration = plan.steps
      .filter(step => step.endTime && step.startTime)
      .map(step => step.endTime!.getTime() - step.startTime!.getTime())
      .reduce((sum, duration) => sum + duration, 0) / plan.completedSteps;

    if (avgStepDuration > 60000) { // > 1 minute per step
      lessons.push(`Average step duration was ${Math.round(avgStepDuration / 1000)}s - consider optimizing for faster execution`);
    }

    return lessons.slice(0, 5); // Limit to 5 lessons
  }

  /**
   * Detect potential SOP candidates
   */
  detectSOPCandidates(metadata: CompletionMetadata): string[] {
    const candidates: string[] = [];

    const { researchOutput, executionResult } = metadata;

    // Check for repeated patterns in approach
    if (researchOutput.plan.approach.length > 3) {
      candidates.push('Consider creating SOP for this multi-step approach pattern');
    }

    // Check for successful high-risk options
    const selectedOption = researchOutput.options.find(o => o.id === researchOutput.recommendation.optionId);
    if (selectedOption && selectedOption.risk === 'high' && executionResult.success) {
      candidates.push('High-risk option succeeded - document this approach for future reference');
    }

    // Check for recovery patterns
    const recoverySteps = executionResult.executionPlan.steps.filter(step => step.description.includes('[RECOVERY]')).length;
    if (recoverySteps > 2) {
      candidates.push('Multiple recovery steps used - consider SOP for error recovery patterns');
    }

    return candidates.slice(0, 3); // Limit to 3 candidates
  }

  /**
   * Update SOP files with new lessons (optional)
   */
  async updateSOPs(metadata: CompletionMetadata): Promise<void> {
    if (!this.options.updateSOPs) return;

    const lessons = this.analyzeLessons(metadata);
    const candidates = this.detectSOPCandidates(metadata);

    if (lessons.length === 0 && candidates.length === 0) return;

    const sopDir = path.join('.agent', 'sop');
    if (!fs.existsSync(sopDir)) {
      fs.mkdirSync(sopDir, { recursive: true });
    }

    // For now, just log - in a real implementation, this would update specific SOP files
    console.log('📚 SOP Update Candidates:');
    lessons.forEach(lesson => console.log(`   - ${lesson}`));
    candidates.forEach(candidate => console.log(`   - ${candidate}`));
  }

  /**
   * Generate URL-friendly slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  /**
   * Complete auto-documentation workflow
   */
  async documentCompletion(metadata: CompletionMetadata): Promise<string> {
    // Analyze for lessons and SOP candidates
    metadata.lessonsLearned = this.analyzeLessons(metadata);
    metadata.sopCandidates = this.detectSOPCandidates(metadata);

    // Generate and save documentation
    const docPath = await this.saveCompletionDoc(metadata);

    // Update SOPs if enabled
    await this.updateSOPs(metadata);

    return docPath;
  }
}