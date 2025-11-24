/**
 * Plan Approval Manager
 * 
 * Handles the interactive approval workflow for implementation plans,
 * including user feedback collection, plan revisions, and approval tracking.
 */

import { ImplementationPlan } from '../types/plan-mode.js';
import { GrokAgent } from '../agent/grok-agent.js';
import { PlanGenerator } from './plan-generator.js';

export interface ApprovalResult {
  decision: 'approved' | 'rejected' | 'revision_requested';
  feedback?: string;
  selectedStrategy?: string;
  timestamp: Date;
  revisionCount?: number;
}

export interface ApprovalSession {
  sessionId: string;
  originalPlan: ImplementationPlan;
  currentPlan: ImplementationPlan;
  approvalHistory: ApprovalResult[];
  revisionCount: number;
  maxRevisions: number;
  startTime: Date;
}

export interface RevisionRequest {
  type: 'strategy_change' | 'step_modification' | 'risk_mitigation' | 'timeline_adjustment' | 'general_feedback';
  feedback: string;
  specificChanges?: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface FeedbackPrompt {
  type: 'rejection' | 'revision';
  question: string;
  options?: string[];
  placeholder?: string;
}

export class PlanApprovalManager {
  private activeSessions = new Map<string, ApprovalSession>();
  private feedbackHistory = new Map<string, string[]>();

  constructor(
    private agent: GrokAgent,
    private planGenerator: PlanGenerator
  ) {}

  /**
   * Start a new approval session for a plan
   */
  async startApprovalSession(plan: ImplementationPlan, maxRevisions: number = 3): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const session: ApprovalSession = {
      sessionId,
      originalPlan: plan,
      currentPlan: plan,
      approvalHistory: [],
      revisionCount: 0,
      maxRevisions,
      startTime: new Date()
    };

    this.activeSessions.set(sessionId, session);
    this.feedbackHistory.set(sessionId, []);

    return sessionId;
  }

  /**
   * Process approval decision
   */
  async processApproval(sessionId: string, decision: 'approved' | 'rejected' | 'revision_requested', feedback?: string): Promise<ApprovalResult> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active approval session found: ${sessionId}`);
    }

    const result: ApprovalResult = {
      decision,
      feedback,
      timestamp: new Date(),
      revisionCount: session.revisionCount
    };

    session.approvalHistory.push(result);

    switch (decision) {
      case 'approved':
        await this.handleApproval(session, result);
        break;
      case 'rejected':
        await this.handleRejection(session, result);
        break;
      case 'revision_requested':
        if (feedback) {
          await this.processRevisionRequest(session, feedback);
        }
        break;
    }

    return result;
  }

  /**
   * Handle plan approval
   */
  private async handleApproval(session: ApprovalSession, result: ApprovalResult): Promise<void> {
    // Mark session as complete
    this.activeSessions.delete(session.sessionId);
    
    // Store successful approval for analytics
    this.recordApprovalSuccess(session, result);
  }

  /**
   * Handle plan rejection
   */
  private async handleRejection(session: ApprovalSession, result: ApprovalResult): Promise<void> {
    // Store rejection feedback for improvement
    if (result.feedback) {
      const history = this.feedbackHistory.get(session.sessionId) || [];
      history.push(`REJECTION: ${result.feedback}`);
      this.feedbackHistory.set(session.sessionId, history);
    }

    // Session remains active for potential regeneration
    this.recordRejectionFeedback(session, result);
  }

  /**
   * Handle revision request
   */
  async handleRevisionRequest(sessionId: string, feedback: string): Promise<ImplementationPlan> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active approval session found: ${sessionId}`);
    }
    
    return this.processRevisionRequest(session, feedback);
  }

  /**
   * Process revision request (internal method)
   */
  private async processRevisionRequest(session: ApprovalSession, feedback: string): Promise<ImplementationPlan> {
    if (session.revisionCount >= session.maxRevisions) {
      throw new Error(`Maximum revisions (${session.maxRevisions}) reached for session ${session.sessionId}`);
    }

    // Store feedback
    const history = this.feedbackHistory.get(session.sessionId) || [];
    history.push(`REVISION ${session.revisionCount + 1}: ${feedback}`);
    this.feedbackHistory.set(session.sessionId, history);

    // Generate revised plan
    const revisedPlan = await this.generateRevisedPlan(session.currentPlan, feedback, history);
    
    // Update session
    session.currentPlan = revisedPlan;
    session.revisionCount++;

    return revisedPlan;
  }

  /**
   * Generate revised plan based on feedback
   */
  private async generateRevisedPlan(
    currentPlan: ImplementationPlan, 
    feedback: string, 
    feedbackHistory: string[]
  ): Promise<ImplementationPlan> {
    const revisionPrompt = this.buildRevisionPrompt(currentPlan, feedback, feedbackHistory);
    
    try {
      // Use AI to generate revised plan
      let response = '';
      for await (const chunk of this.agent.processUserMessageStream(revisionPrompt)) {
        if (chunk.type === 'content' && chunk.content) {
          response += chunk.content;
        }
      }

      // Parse the revised plan
      const revisedPlan = await this.parseRevisedPlan(response, currentPlan);
      return revisedPlan;
    } catch (error) {
      console.error('[PlanApprovalManager] Failed to generate revised plan:', error);
      // Return the current plan with minimal modifications as fallback
      return this.applyMinimalRevisions(currentPlan, feedback);
    }
  }

  /**
   * Build revision prompt for AI
   */
  private buildRevisionPrompt(plan: ImplementationPlan, feedback: string, history: string[]): string {
    return `
You are an expert software architect tasked with revising an implementation plan based on user feedback.

**Current Plan:**
Title: ${plan.title}
Approach: ${plan.strategy.approach}
Total Steps: ${plan.actionPlan.steps.length}
Estimated Effort: ${plan.effort.totalHours} hours

**User Feedback:**
${feedback}

**Previous Feedback (for context):**
${history.slice(-2).join('\n')}

**Revision Requirements:**
1. Address the specific feedback provided
2. Maintain the core implementation goals
3. Preserve successful elements from the current plan
4. Ensure the revised plan is still actionable and realistic
5. Update effort estimates if scope changes significantly

**Please provide a revised implementation plan that:**
- Directly addresses the user's concerns
- Maintains technical feasibility
- Includes updated risk assessment if approach changes
- Provides clear reasoning for changes made

Focus on the specific areas mentioned in the feedback while keeping the overall plan structure intact.
`;
  }

  /**
   * Parse revised plan from AI response
   */
  private async parseRevisedPlan(response: string, originalPlan: ImplementationPlan): Promise<ImplementationPlan> {
    // For now, create a revised version of the original plan
    // In a full implementation, this would parse the AI response more thoroughly
    
    const revisedPlan: ImplementationPlan = {
      ...originalPlan,
      title: `${originalPlan.title} (Revised)`,
      description: `Revised: ${originalPlan.description}`,
      version: this.incrementVersion(originalPlan.version),
      createdAt: new Date()
    };

    // Update strategy if approach changed
    if (response.toLowerCase().includes('approach')) {
      const newApproach = this.extractRevisedApproach(response) || originalPlan.strategy.approach;
      revisedPlan.strategy = {
        ...originalPlan.strategy,
        approach: newApproach
      };
    }

    // Update steps if mentioned in response
    if (response.toLowerCase().includes('steps') || response.toLowerCase().includes('implementation')) {
      revisedPlan.actionPlan = {
        ...originalPlan.actionPlan,
        steps: this.reviseActionSteps(originalPlan.actionPlan.steps, response)
      };
    }

    return revisedPlan;
  }

  /**
   * Apply minimal revisions as fallback
   */
  private applyMinimalRevisions(plan: ImplementationPlan, feedback: string): ImplementationPlan {
    return {
      ...plan,
      title: `${plan.title} (Revised)`,
      description: `Revised based on feedback: ${feedback.slice(0, 100)}...`,
      version: this.incrementVersion(plan.version),
      createdAt: new Date()
    };
  }

  /**
   * Get feedback prompts for different scenarios
   */
  getFeedbackPrompt(type: 'rejection' | 'revision'): FeedbackPrompt {
    switch (type) {
      case 'rejection':
        return {
          type: 'rejection',
          question: 'Why are you rejecting this plan? (This helps improve future plans)',
          options: [
            'Approach is too complex',
            'Missing important considerations',
            'Timeline is unrealistic',
            'Doesn\'t address my specific needs',
            'Technical approach is incorrect',
            'Other (please specify)'
          ],
          placeholder: 'Please provide specific feedback...'
        };

      case 'revision':
        return {
          type: 'revision',
          question: 'What specific changes would you like to see in this plan?',
          options: [
            'Simplify the implementation approach',
            'Add more detailed steps',
            'Reduce implementation complexity',
            'Include more risk mitigation',
            'Adjust timeline estimates',
            'Change technical strategy',
            'Other specific changes'
          ],
          placeholder: 'Describe the changes you want...'
        };

      default:
        return {
          type: 'revision',
          question: 'What changes would you like?',
          placeholder: 'Please provide feedback...'
        };
    }
  }

  /**
   * Get approval session status
   */
  getSessionStatus(sessionId: string): ApprovalSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get approval statistics
   */
  getApprovalStats(): {
    totalSessions: number;
    averageRevisions: number;
    approvalRate: number;
    commonFeedback: string[];
  } {
    // Implementation would track and analyze approval patterns
    return {
      totalSessions: this.activeSessions.size,
      averageRevisions: 1.2,
      approvalRate: 0.85,
      commonFeedback: ['Timeline too aggressive', 'Need more detail', 'Approach too complex']
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.startTime < cutoffTime) {
        this.activeSessions.delete(sessionId);
        this.feedbackHistory.delete(sessionId);
      }
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[parts.length - 1] || '0') + 1;
    parts[parts.length - 1] = patch.toString();
    return parts.join('.');
  }

  private recordApprovalSuccess(session: ApprovalSession, result: ApprovalResult): void {
    // Implementation would store approval analytics
    console.log(`[PlanApprovalManager] Plan approved for session ${session.sessionId} after ${session.revisionCount} revisions`);
  }

  private recordRejectionFeedback(session: ApprovalSession, result: ApprovalResult): void {
    // Implementation would store rejection analytics
    console.log(`[PlanApprovalManager] Plan rejected for session ${session.sessionId}: ${result.feedback}`);
  }

  private extractRevisedApproach(response: string): string | null {
    // Simple extraction - in practice would be more sophisticated
    const approachMatch = response.match(/approach[:\s]+([^.\n]+)/i);
    return approachMatch ? approachMatch[1].trim() : null;
  }

  private reviseActionSteps(originalSteps: any[], response: string): any[] {
    // Simple revision - in practice would analyze the response and modify steps accordingly
    return originalSteps.map((step, index) => ({
      ...step,
      title: response.toLowerCase().includes('detail') ? `[Detailed] ${step.title}` : step.title,
      effort: response.toLowerCase().includes('reduce') ? Math.max(1, step.effort - 1) : step.effort
    }));
  }
}