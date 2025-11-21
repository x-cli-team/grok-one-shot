/**
 * Research & Recommend Types
 *
 * Defines the type system for the structured research output and recommendation flow.
 * Part of the "Research → Recommend → Execute → Auto-Doc" workflow.
 */

export interface ResearchIssue {
  type: 'fact' | 'gap' | 'risk';
  description: string;
  severity?: 'low' | 'medium' | 'high';
  impact?: string;
}

export interface ResearchOption {
  id: number;
  title: string;
  description: string;
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
}

export interface ResearchRecommendation {
  optionId: number;
  reasoning: string;
  justification: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface ResearchPlan {
  summary: string;
  approach: string[];
  todo: string[];
  estimatedEffort: string;
  keyConsiderations: string[];
}

export interface ResearchOutput {
  issues: ResearchIssue[];
  options: ResearchOption[];
  recommendation: ResearchRecommendation;
  plan: ResearchPlan;
}

export interface ResearchRequest {
  userTask: string;
  context?: string;
  constraints?: string[];
  preferences?: string[];
}

export interface ApprovalResponse {
  approved: boolean;
  revised?: boolean;
  revisionNote?: string;
}

export interface ResearchConfig {
  maxOptions: number;
  includeContext: boolean;
  timeout: number;
}