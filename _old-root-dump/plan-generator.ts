/**
 * Plan Generator Service
 * 
 * AI-powered implementation plan generation for Plan Mode.
 * Takes exploration data and user requirements to create
 * detailed, actionable implementation plans.
 */

import { 
  ExplorationData,
  ImplementationPlan,
  ImplementationStrategy,
  ActionPlan,
  ActionStep,
  RiskAssessment,
  EffortEstimate,
  Risk,
  MitigationStrategy
} from '../types/plan-mode.js';
import { GrokAgent } from '../agent/grok-agent.js';

interface PlanGenerationOptions {
  /** User's original request/task */
  userRequest: string;
  /** Exploration data from codebase analysis */
  explorationData: ExplorationData;
  /** Additional context or constraints */
  constraints?: string[];
  /** Preferred implementation approach */
  preferredApproach?: string;
  /** Time constraints */
  timeConstraints?: string;
  /** Quality requirements */
  qualityRequirements?: string[];
}

interface PlanGenerationContext {
  projectType: string;
  primaryLanguage: string;
  complexity: number;
  hasTests: boolean;
  architecturePatterns: string[];
  keyComponents: string[];
}

interface StrategyOption {
  id: string;
  title: string;
  approach: string;
  pros: string[];
  cons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  effortEstimate: number;
  complexity: number;
  confidence: number;
  recommended: boolean;
  tradeoffs: string[];
}

export class PlanGenerator {
  constructor(private agent: GrokAgent) {}

  /**
   * Generate a comprehensive implementation plan
   */
  async generatePlan(options: PlanGenerationOptions): Promise<ImplementationPlan> {
    try {
      const context = this.buildGenerationContext(options.explorationData);
      
      // Generate implementation strategy
      const strategy = await this.generateImplementationStrategy(options, context);
      
      // Create detailed action plan
      const actionPlan = await this.generateActionPlan(options, context, strategy);
      
      // Assess risks
      const risks = await this.assessRisks(options, context, actionPlan);
      
      // Estimate effort
      const effort = await this.estimateEffort(actionPlan, context);
      
      // Generate success criteria
      const successCriteria = await this.generateSuccessCriteria(options, context);

      const plan: ImplementationPlan = {
        title: this.generatePlanTitle(options.userRequest),
        description: this.generatePlanDescription(options.userRequest, context),
        strategy,
        actionPlan,
        risks,
        effort,
        successCriteria,
        createdAt: new Date(),
        version: '1.0'
      };

      return plan;
    } catch (error) {
      console.error('[PlanGenerator] Failed to generate plan:', error);
      throw new Error(`Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build context for plan generation
   */
  private buildGenerationContext(explorationData: ExplorationData): PlanGenerationContext {
    return {
      projectType: explorationData.projectStructure.projectType,
      primaryLanguage: explorationData.projectStructure.primaryLanguage,
      complexity: explorationData.complexity.overall,
      hasTests: explorationData.projectStructure.testDirectories.length > 0,
      architecturePatterns: explorationData.architecturePatterns.map(p => p.name),
      keyComponents: explorationData.keyComponents.core.map(c => c.name)
    };
  }

  /**
   * Generate multiple implementation strategies with trade-off analysis
   */
  private async generateImplementationStrategy(
    options: PlanGenerationOptions,
    context: PlanGenerationContext
  ): Promise<ImplementationStrategy> {
    const strategyPrompt = this.buildEnhancedStrategyPrompt(options, context);
    
    // Use AI to generate multiple strategy options
    const strategyResponse = await this.generateWithAI(strategyPrompt);
    
    // Extract the primary strategy (we can extend this to support multiple options)
    return {
      approach: this.extractApproach(strategyResponse, options.userRequest),
      principles: this.extractPrinciples(strategyResponse, context),
      techStack: this.generateTechStackRecommendations(context, strategyResponse),
      architectureDecisions: this.generateArchitectureDecisions(context, strategyResponse),
      integrationPoints: this.identifyIntegrationPoints(options.explorationData, strategyResponse)
    };
  }

  /**
   * Generate multiple strategy options for user selection
   */
  async generateStrategyOptions(options: PlanGenerationOptions, context: PlanGenerationContext): Promise<StrategyOption[]> {
    const optionsPrompt = this.buildStrategyOptionsPrompt(options, context);
    const response = await this.generateWithAI(optionsPrompt);
    return this.parseStrategyOptions(response, context);
  }

  /**
   * Generate detailed action plan
   */
  private async generateActionPlan(
    options: PlanGenerationOptions,
    context: PlanGenerationContext,
    strategy: ImplementationStrategy
  ): Promise<ActionPlan> {
    const actionPrompt = this.buildActionPrompt(options, context, strategy);
    
    // Use AI to generate action steps
    const actionResponse = await this.generateWithAI(actionPrompt);
    
    const steps = this.parseActionSteps(actionResponse, context);
    const milestones = this.generateMilestones(steps);
    const dependencies = this.analyzeDependencies(steps);
    const parallelTracks = this.identifyParallelTracks(steps, dependencies);

    return {
      steps,
      parallelTracks,
      milestones,
      dependencies
    };
  }

  /**
   * Assess implementation risks
   */
  private async assessRisks(
    options: PlanGenerationOptions,
    context: PlanGenerationContext,
    actionPlan: ActionPlan
  ): Promise<RiskAssessment> {
    const risks = this.identifyRisks(options, context, actionPlan);
    const mitigations = this.generateMitigations(risks, context);
    const overallRisk = this.calculateOverallRisk(risks);

    return {
      overallRisk,
      risks,
      mitigations,
      contingencies: this.generateContingencyPlans(risks, actionPlan)
    };
  }

  /**
   * Estimate implementation effort
   */
  private async estimateEffort(
    actionPlan: ActionPlan,
    context: PlanGenerationContext
  ): Promise<EffortEstimate> {
    const baseHours = actionPlan.steps.reduce((total, step) => total + step.effort, 0);
    const complexityMultiplier = this.getComplexityMultiplier(context.complexity);
    const experienceMultiplier = this.getExperienceMultiplier(context.primaryLanguage);
    
    const totalHours = Math.round(baseHours * complexityMultiplier * experienceMultiplier);
    
    const breakdownByType = this.calculateBreakdownByType(actionPlan.steps);
    const breakdownByTrack = this.calculateBreakdownByTrack(actionPlan.parallelTracks, actionPlan.steps);
    
    const confidence = this.calculateEstimateConfidence(context, actionPlan.steps.length);
    const factors = this.identifyEstimationFactors(context);
    const timeline = this.projectTimeline(totalHours, actionPlan.parallelTracks.length);

    return {
      totalHours,
      breakdownByType,
      breakdownByTrack,
      confidence,
      factors,
      timeline
    };
  }

  /**
   * Build enhanced strategy generation prompt
   */
  private buildEnhancedStrategyPrompt(options: PlanGenerationOptions, context: PlanGenerationContext): string {
    return `
As an expert software architect, analyze this implementation request and provide a comprehensive strategy.

**User Request:** ${options.userRequest}

**Project Context:**
- Type: ${context.projectType}
- Language: ${context.primaryLanguage}
- Complexity: ${context.complexity}/10
- Has Tests: ${context.hasTests}
- Architecture Patterns: ${context.architecturePatterns.join(', ')}
- Key Components: ${context.keyComponents.join(', ')}

**Additional Context:**
${options.constraints ? `- Constraints: ${options.constraints.join(', ')}` : ''}
${options.preferredApproach ? `- Preferred Approach: ${options.preferredApproach}` : ''}
${options.timeConstraints ? `- Time Constraints: ${options.timeConstraints}` : ''}

Please provide:
1. **High-level approach** (1-2 sentences)
2. **Key principles** (3-5 principles to guide implementation)
3. **Technology recommendations** (specific to this project)
4. **Architecture decisions** (major structural choices)
5. **Integration considerations** (how this fits with existing code)

Focus on practical, actionable guidance that considers the existing codebase structure and patterns.

**Enhanced Analysis Requirements:**
- Consider integration challenges with existing architecture
- Evaluate performance implications of different approaches
- Assess maintainability and future extensibility
- Include security considerations where relevant
- Provide clear reasoning for recommendations
`;
  }

  /**
   * Build strategy options generation prompt
   */
  private buildStrategyOptionsPrompt(options: PlanGenerationOptions, context: PlanGenerationContext): string {
    return `
As an expert software architect, generate 2-3 alternative implementation strategies for this request:

**User Request:** ${options.userRequest}

**Project Context:**
- Type: ${context.projectType}
- Language: ${context.primaryLanguage}
- Complexity: ${context.complexity}/10
- Has Tests: ${context.hasTests}
- Architecture Patterns: ${context.architecturePatterns.join(', ')}
- Key Components: ${context.keyComponents.join(', ')}

For EACH strategy option, provide:

**Option 1: [Strategy Name]**
- **Approach**: Brief description of the implementation approach
- **Pros**: 3-4 advantages of this approach
- **Cons**: 2-3 potential drawbacks or challenges
- **Risk Level**: Low/Medium/High with brief justification
- **Effort**: Estimated hours (be realistic)
- **Complexity**: Implementation complexity 1-10
- **Best For**: What scenarios this approach works best for

**Option 2: [Strategy Name]**
[Same format as Option 1]

**Option 3: [Strategy Name]** (if applicable)
[Same format as Option 1]

**Recommendation**: Which option you recommend and why, considering the project context.

Make each option distinctly different in approach (e.g., incremental vs. complete rewrite, different architectural patterns, etc.).
`;
  }

  /**
   * Build action plan generation prompt
   */
  private buildActionPrompt(
    options: PlanGenerationOptions,
    context: PlanGenerationContext,
    strategy: ImplementationStrategy
  ): string {
    return `
Create a detailed, step-by-step action plan for this implementation:

**Request:** ${options.userRequest}
**Approach:** ${strategy.approach}

**Context:**
- Project: ${context.projectType} (${context.primaryLanguage})
- Complexity: ${context.complexity}/10
- Architecture: ${context.architecturePatterns.join(', ')}

**Key Principles:**
${strategy.principles.map(p => `- ${p}`).join('\n')}

Please provide a numbered list of specific, actionable steps. For each step include:
1. **Title** (brief, actionable)
2. **Description** (what exactly to do)
3. **Type** (research/design/implement/test/document/deploy)
4. **Effort** (estimated hours)
5. **Files affected** (specific file paths when known)
6. **Dependencies** (which steps must come first)

Focus on:
- Concrete, executable actions
- Logical progression from setup to completion
- Realistic effort estimates
- Clear dependencies between steps
- Integration with existing code patterns

Provide 8-15 steps total, balancing thoroughness with practicality.
`;
  }

  /**
   * Generate strategy response using AI
   */
  private async generateWithAI(prompt: string): Promise<string> {
    try {
      let response = '';
      
      for await (const chunk of this.agent.processUserMessageStream(prompt)) {
        if (chunk.type === 'content' && chunk.content) {
          response += chunk.content;
        }
      }
      
      return response;
    } catch (error) {
      console.error('[PlanGenerator] AI generation failed:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Extract implementation approach from AI response
   */
  private extractApproach(response: string, userRequest: string): string {
    // Look for approach section in AI response
    const approachMatch = response.match(/(?:approach|strategy):\s*([^\n]+)/i);
    if (approachMatch) {
      return approachMatch[1].trim();
    }
    
    // Fallback: generate simple approach
    return `Implement ${userRequest} following existing project patterns and best practices`;
  }

  /**
   * Extract key principles from AI response
   */
  private extractPrinciples(response: string, _context: PlanGenerationContext): string[] {
    const principles: string[] = [];
    
    // Look for principles section
    const principlesSection = response.match(/principles?:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
    if (principlesSection) {
      const lines = principlesSection[1].split('\n');
      for (const line of lines) {
        const cleaned = line.trim().replace(/^[-*•]\s*/, '');
        if (cleaned.length > 10) {
          principles.push(cleaned);
        }
      }
    }
    
    // Add default principles if none found
    if (principles.length === 0) {
      principles.push(
        'Follow existing code patterns and conventions',
        'Maintain backward compatibility',
        'Write tests for new functionality',
        'Document changes and new features',
        'Ensure performance and security'
      );
    }
    
    return principles.slice(0, 5); // Limit to 5 principles
  }

  /**
   * Parse action steps from AI response
   */
  private parseActionSteps(response: string, context: PlanGenerationContext): ActionStep[] {
    const steps: ActionStep[] = [];
    
    // Look for numbered steps
    const stepMatches = response.match(/\d+\.\s*\*\*([^*]+)\*\*[\s\S]*?(?=\d+\.\s*\*\*|\n\n|$)/g);
    
    if (stepMatches) {
      stepMatches.forEach((stepText, index) => {
        const step = this.parseIndividualStep(stepText, index + 1, context);
        if (step) {
          steps.push(step);
        }
      });
    }
    
    // Fallback: generate basic steps if parsing fails
    if (steps.length === 0) {
      steps.push(...this.generateFallbackSteps(context));
    }
    
    return steps;
  }

  /**
   * Parse individual step from text
   */
  private parseIndividualStep(stepText: string, order: number, context: PlanGenerationContext): ActionStep | null {
    const titleMatch = stepText.match(/\*\*([^*]+)\*\*/);
    if (!titleMatch) return null;
    
    const title = titleMatch[1].trim();
    const description = this.extractStepDescription(stepText);
    const type = this.inferStepType(title, description);
    const effort = this.estimateStepEffort(title, description, type, context);
    const affectedFiles = this.extractAffectedFiles(stepText);
    
    return {
      id: `step_${order}`,
      title,
      description,
      type,
      effort,
      skills: this.inferRequiredSkills(type, context),
      affectedFiles,
      acceptanceCriteria: this.generateAcceptanceCriteria(title, type),
      order
    };
  }

  // Utility methods for plan generation
  private generatePlanTitle(userRequest: string): string {
    return `Implementation Plan: ${userRequest}`;
  }

  private generatePlanDescription(userRequest: string, context: PlanGenerationContext): string {
    return `Comprehensive implementation plan for "${userRequest}" in ${context.primaryLanguage} ${context.projectType} project. This plan considers existing architecture patterns and maintains compatibility with current codebase structure.`;
  }

  private generateSuccessCriteria(_options: PlanGenerationOptions, _context: PlanGenerationContext): Promise<string[]> {
    return Promise.resolve([
      'Implementation meets functional requirements',
      'Code follows existing patterns and conventions',
      'All tests pass including new test coverage',
      'Documentation is updated and complete',
      'Performance meets or exceeds current benchmarks',
      'Security requirements are satisfied',
      'Integration with existing systems is seamless'
    ]);
  }

  private getFallbackResponse(_prompt: string): string {
    return `
**Approach:** Implement the requested feature following established patterns and best practices.

**Key Principles:**
- Follow existing code conventions
- Maintain backward compatibility  
- Write comprehensive tests
- Document all changes
- Ensure performance and security

**Steps:**
1. **Analyze Requirements** - Review the request and existing code
2. **Design Solution** - Plan the implementation approach
3. **Implement Core** - Build the main functionality
4. **Add Tests** - Create comprehensive test coverage
5. **Document** - Update documentation and comments
6. **Review** - Code review and refinement
`;
  }

  // Additional utility methods would be implemented here for:
  // - generateTechStackRecommendations
  // - generateArchitectureDecisions
  // - identifyIntegrationPoints
  // - identifyRisks
  // - generateMitigations
  // - etc.

  private generateTechStackRecommendations(_context: PlanGenerationContext, _response: string): any[] {
    // Implementation would extract tech stack recommendations from AI response
    return [];
  }

  private generateArchitectureDecisions(_context: PlanGenerationContext, _response: string): any[] {
    // Implementation would extract architecture decisions from AI response
    return [];
  }

  private identifyIntegrationPoints(_explorationData: ExplorationData, _response: string): any[] {
    // Implementation would identify integration points
    return [];
  }

  private identifyRisks(_options: PlanGenerationOptions, _context: PlanGenerationContext, _actionPlan: ActionPlan): Risk[] {
    // Implementation would identify potential risks
    return [];
  }

  private generateMitigations(_risks: Risk[], _context: PlanGenerationContext): MitigationStrategy[] {
    // Implementation would generate risk mitigation strategies
    return [];
  }

  private calculateOverallRisk(risks: Risk[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'low';
    const avgRisk = risks.reduce((sum, risk) => sum + risk.score, 0) / risks.length;
    if (avgRisk < 2) return 'low';
    if (avgRisk < 4) return 'medium';
    if (avgRisk < 6) return 'high';
    return 'critical';
  }

  private generateContingencyPlans(_risks: Risk[], _actionPlan: ActionPlan): any[] {
    // Implementation would generate contingency plans
    return [];
  }

  private getComplexityMultiplier(complexity: number): number {
    return 1 + (complexity - 5) * 0.1; // Scale around 1.0
  }

  private getExperienceMultiplier(_language: string): number {
    // Assume average experience, could be made configurable
    return 1.0;
  }

  private calculateBreakdownByType(steps: ActionStep[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const step of steps) {
      breakdown[step.type] = (breakdown[step.type] || 0) + step.effort;
    }
    return breakdown;
  }

  private calculateBreakdownByTrack(_tracks: any[], _steps: ActionStep[]): Record<string, number> {
    // Implementation would calculate effort breakdown by track
    return {};
  }

  private calculateEstimateConfidence(context: PlanGenerationContext, stepCount: number): number {
    let confidence = 0.8; // Base confidence
    if (context.complexity > 7) confidence -= 0.1;
    if (stepCount > 15) confidence -= 0.1;
    if (!context.hasTests) confidence -= 0.1;
    return Math.max(0.5, confidence);
  }

  private identifyEstimationFactors(_context: PlanGenerationContext): any[] {
    // Implementation would identify factors affecting estimates
    return [];
  }

  private projectTimeline(totalHours: number, trackCount: number): any {
    const _daysPerWeek = 5;
    const hoursPerDay = 6; // Accounting for other work
    
    const sequentialDays = Math.ceil(totalHours / hoursPerDay);
    const parallelDays = Math.ceil(sequentialDays / Math.max(1, trackCount));
    
    return {
      optimistic: `${Math.ceil(parallelDays * 0.8)} days`,
      mostLikely: `${parallelDays} days`,
      pessimistic: `${Math.ceil(parallelDays * 1.5)} days`,
      recommendedStart: 'As soon as possible',
      criticalPath: `${sequentialDays} days if done sequentially`
    };
  }

  private generateMilestones(_steps: ActionStep[]): any[] {
    // Implementation would generate milestones from steps
    return [];
  }

  private analyzeDependencies(_steps: ActionStep[]): any[] {
    // Implementation would analyze step dependencies
    return [];
  }

  private identifyParallelTracks(_steps: ActionStep[], _dependencies: any[]): any[] {
    // Implementation would identify parallel work tracks
    return [];
  }

  private extractStepDescription(stepText: string): string {
    // Extract description from step text
    const lines = stepText.split('\n').slice(1); // Skip title line
    return lines.join(' ').replace(/\*\*/g, '').trim() || 'Complete this step';
  }

  private inferStepType(title: string, description: string): ActionStep['type'] {
    const text = (title + ' ' + description).toLowerCase();
    if (text.includes('research') || text.includes('analyze') || text.includes('investigate')) return 'research';
    if (text.includes('design') || text.includes('plan') || text.includes('architect')) return 'design';
    if (text.includes('test') || text.includes('spec')) return 'test';
    if (text.includes('document') || text.includes('readme') || text.includes('comment')) return 'document';
    if (text.includes('deploy') || text.includes('publish') || text.includes('release')) return 'deploy';
    return 'implement';
  }

  private estimateStepEffort(title: string, description: string, type: ActionStep['type'], context: PlanGenerationContext): number {
    let baseHours = 4; // Default
    
    switch (type) {
      case 'research': baseHours = 2; break;
      case 'design': baseHours = 3; break;
      case 'implement': baseHours = 6; break;
      case 'test': baseHours = 3; break;
      case 'document': baseHours = 2; break;
      case 'deploy': baseHours = 2; break;
    }
    
    // Adjust for complexity
    const complexityMultiplier = 1 + (context.complexity - 5) * 0.1;
    
    return Math.max(1, Math.round(baseHours * complexityMultiplier));
  }

  private extractAffectedFiles(stepText: string): string[] {
    // Look for file mentions in step text
    const fileMatches = stepText.match(/[\w.-]+\.(js|ts|jsx|tsx|py|java|go|rs|json|md|yml|yaml)/g);
    return fileMatches || [];
  }

  private inferRequiredSkills(type: ActionStep['type'], context: PlanGenerationContext): string[] {
    const skills: string[] = [context.primaryLanguage];
    
    switch (type) {
      case 'research':
        skills.push('Analysis', 'Documentation');
        break;
      case 'design':
        skills.push('Architecture', 'System Design');
        break;
      case 'implement':
        skills.push('Programming', context.projectType);
        break;
      case 'test':
        skills.push('Testing', 'QA');
        break;
      case 'document':
        skills.push('Technical Writing');
        break;
      case 'deploy':
        skills.push('DevOps', 'Deployment');
        break;
    }
    
    return skills;
  }

  private generateAcceptanceCriteria(title: string, type: ActionStep['type']): string[] {
    const criteria: string[] = [];
    
    switch (type) {
      case 'implement':
        criteria.push('Code compiles without errors');
        criteria.push('Functionality works as specified');
        criteria.push('Code follows project conventions');
        break;
      case 'test':
        criteria.push('All tests pass');
        criteria.push('Test coverage meets requirements');
        break;
      case 'document':
        criteria.push('Documentation is complete and accurate');
        criteria.push('Examples are provided where appropriate');
        break;
      default:
        criteria.push('Step objectives are met');
        criteria.push('Quality standards are maintained');
    }
    
    return criteria;
  }

  private generateFallbackSteps(context: PlanGenerationContext): ActionStep[] {
    return [
      {
        id: 'step_1',
        title: 'Analyze Requirements',
        description: 'Review the implementation requirements and existing codebase',
        type: 'research',
        effort: 2,
        skills: ['Analysis'],
        affectedFiles: [],
        acceptanceCriteria: ['Requirements are clearly understood'],
        order: 1
      },
      {
        id: 'step_2', 
        title: 'Design Solution',
        description: 'Create technical design for the implementation',
        type: 'design',
        effort: 3,
        skills: ['Design', context.primaryLanguage],
        affectedFiles: [],
        acceptanceCriteria: ['Design is documented and approved'],
        order: 2
      },
      {
        id: 'step_3',
        title: 'Implement Core Functionality',
        description: 'Build the main implementation',
        type: 'implement',
        effort: 6,
        skills: ['Programming', context.primaryLanguage],
        affectedFiles: [],
        acceptanceCriteria: ['Core functionality works correctly'],
        order: 3
      }
    ];
  }

  /**
   * Parse strategy options from AI response
   */
  private parseStrategyOptions(response: string, context: PlanGenerationContext): StrategyOption[] {
    const options: StrategyOption[] = [];
    let optionCounter = 1;

    // Look for option sections
    const optionMatches = response.match(/\*\*Option\s+\d+:\s*([^*]+)\*\*([\s\S]*?)(?=\*\*Option\s+\d+:|$)/g);
    
    if (optionMatches) {
      optionMatches.forEach((optionText, index) => {
        const option = this.parseIndividualStrategyOption(optionText, `option_${optionCounter}`, context);
        if (option) {
          options.push(option);
          optionCounter++;
        }
      });
    }

    // Add fallback options if parsing fails
    if (options.length === 0) {
      options.push(...this.generateFallbackStrategyOptions(context));
    }

    // Mark the first option as recommended if none are explicitly marked
    if (options.length > 0 && !options.some(o => o.recommended)) {
      options[0].recommended = true;
    }

    return options;
  }

  /**
   * Parse individual strategy option
   */
  private parseIndividualStrategyOption(optionText: string, id: string, context: PlanGenerationContext): StrategyOption | null {
    const titleMatch = optionText.match(/\*\*Option\s+\d+:\s*([^*]+)\*\*/);
    if (!titleMatch) return null;

    const title = titleMatch[1].trim();
    const approach = this.extractFieldFromOption(optionText, 'Approach') || 'Standard implementation approach';
    const pros = this.extractListFromOption(optionText, 'Pros');
    const cons = this.extractListFromOption(optionText, 'Cons');
    const riskLevel = this.extractRiskLevel(optionText);
    const effort = this.extractEffortFromOption(optionText);
    const complexity = this.extractComplexityFromOption(optionText, context);

    return {
      id,
      title,
      approach,
      pros,
      cons,
      riskLevel,
      effortEstimate: effort,
      complexity,
      confidence: this.calculateStrategyConfidence(pros, cons, riskLevel),
      recommended: false, // Will be set later based on recommendation section
      tradeoffs: this.generateTradeoffs(pros, cons)
    };
  }

  /**
   * Extract field value from strategy option text
   */
  private extractFieldFromOption(text: string, field: string): string {
    const regex = new RegExp(`\\*\\*${field}\\*\\*:?\\s*([^\\n*]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract list items from strategy option text
   */
  private extractListFromOption(text: string, field: string): string[] {
    const items: string[] = [];
    const fieldRegex = new RegExp(`\\*\\*${field}\\*\\*:?\\s*([\\s\\S]*?)(?=\\*\\*[A-Za-z]+\\*\\*|$)`, 'i');
    const fieldMatch = text.match(fieldRegex);
    
    if (fieldMatch) {
      const lines = fieldMatch[1].split('\n');
      for (const line of lines) {
        const cleaned = line.trim().replace(/^[-*•]\s*/, '');
        if (cleaned.length > 5) {
          items.push(cleaned);
        }
      }
    }

    return items;
  }

  /**
   * Extract risk level from strategy option text
   */
  private extractRiskLevel(text: string): 'low' | 'medium' | 'high' {
    const riskText = this.extractFieldFromOption(text, 'Risk Level').toLowerCase();
    if (riskText.includes('low')) return 'low';
    if (riskText.includes('high')) return 'high';
    return 'medium';
  }

  /**
   * Extract effort estimate from strategy option text
   */
  private extractEffortFromOption(text: string): number {
    const effortText = this.extractFieldFromOption(text, 'Effort');
    const hours = effortText.match(/(\d+)\s*hours?/i);
    return hours ? parseInt(hours[1]) : 8; // Default fallback
  }

  /**
   * Extract complexity rating from strategy option text
   */
  private extractComplexityFromOption(text: string, context: PlanGenerationContext): number {
    const complexityText = this.extractFieldFromOption(text, 'Complexity');
    const rating = complexityText.match(/(\d+)/);
    return rating ? parseInt(rating[1]) : context.complexity; // Use project complexity as fallback
  }

  /**
   * Calculate confidence score for strategy
   */
  private calculateStrategyConfidence(pros: string[], cons: string[], riskLevel: 'low' | 'medium' | 'high'): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on pros/cons ratio
    if (pros.length > cons.length) confidence += 0.1;
    if (cons.length > pros.length * 1.5) confidence -= 0.1;

    // Adjust based on risk level
    switch (riskLevel) {
      case 'low': confidence += 0.1; break;
      case 'high': confidence -= 0.2; break;
    }

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Generate tradeoffs from pros and cons
   */
  private generateTradeoffs(pros: string[], cons: string[]): string[] {
    const tradeoffs: string[] = [];
    
    // Create balanced tradeoff statements
    if (pros.length > 0 && cons.length > 0) {
      tradeoffs.push(`Higher ${pros[0].toLowerCase()} but ${cons[0].toLowerCase()}`);
    }
    
    if (pros.length > 1 && cons.length > 1) {
      tradeoffs.push(`${pros[1]} vs. ${cons[1].toLowerCase()}`);
    }

    return tradeoffs;
  }

  /**
   * Generate fallback strategy options
   */
  private generateFallbackStrategyOptions(context: PlanGenerationContext): StrategyOption[] {
    return [
      {
        id: 'incremental',
        title: 'Incremental Implementation',
        approach: 'Build the feature incrementally with small, safe changes',
        pros: ['Lower risk', 'Easier testing', 'Faster feedback'],
        cons: ['Takes longer', 'May require more refactoring'],
        riskLevel: 'low',
        effortEstimate: 12,
        complexity: Math.max(3, context.complexity - 2),
        confidence: 0.8,
        recommended: true,
        tradeoffs: ['Safety vs. speed', 'Incremental progress vs. comprehensive solution']
      },
      {
        id: 'comprehensive',
        title: 'Comprehensive Solution',
        approach: 'Implement a complete solution that addresses all requirements at once',
        pros: ['Complete solution', 'Better architecture', 'More efficient'],
        cons: ['Higher risk', 'Complex testing', 'Longer development'],
        riskLevel: 'medium',
        effortEstimate: 20,
        complexity: Math.min(8, context.complexity + 1),
        confidence: 0.6,
        recommended: false,
        tradeoffs: ['Completeness vs. complexity', 'Efficiency vs. risk']
      }
    ];
  }
}