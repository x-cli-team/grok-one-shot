import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface IncidentInfo {
  id: string;
  title: string;
  date: string;
  trigger: string;
  rootCause: string;
  fix: string;
  impact: 'low' | 'medium' | 'high';
  recurrenceCount: number;
  relatedFiles: string[];
  guardrailCreated?: string;
}

export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  category: 'naming' | 'configuration' | 'architecture' | 'process';
  severity: 'warning' | 'error';
  pattern: string;
  enabled: boolean;
  createdFrom?: string; // incident ID
  lastTriggered?: string;
}

export interface SelfHealingConfig {
  enabled: boolean;
  onErrorPrompt: 'gentle' | 'persistent' | 'off';
  enforceGuardrails: boolean;
  simulateOnPlan: 'off' | 'smart' | 'always';
}

export class SelfHealingSystem {
  private rootPath: string;
  private agentPath: string;
  private config: SelfHealingConfig;

  constructor(rootPath: string, config?: Partial<SelfHealingConfig>) {
    this.rootPath = rootPath;
    this.agentPath = path.join(rootPath, '.agent');
    this.config = {
      enabled: true,
      onErrorPrompt: 'gentle',
      enforceGuardrails: true,
      simulateOnPlan: 'smart',
      ...config
    };
  }

  async captureIncident(error: any, context?: any): Promise<{ success: boolean; incidentId?: string; message: string }> {
    try {
      const incident = await this.analyzeAndCreateIncident(error, context);
      const incidentPath = path.join(this.agentPath, 'incidents', `${incident.id}.md`);
      
      // Ensure incidents directory exists
      await ops.mkdir(path.dirname(incidentPath), { recursive: true });
      
      // Write incident documentation
      const incidentContent = this.generateIncidentContent(incident);
      await ops.promises.writeFile(incidentPath, incidentContent);

      // Try to create a guardrail
      const guardrail = await this.generateGuardrailFromIncident(incident);
      if (guardrail) {
        await this.saveGuardrail(guardrail);
        incident.guardrailCreated = guardrail.id;
      }

      return {
        success: true,
        incidentId: incident.id,
        message: `✅ Incident documented: ${incident.title}\n${guardrail ? `🛡️ Guardrail created: ${guardrail.name}` : ''}\n📁 Saved to: .agent/incidents/${incident.id}.md`
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to capture incident: ${error.message}`
      };
    }
  }

  private async analyzeAndCreateIncident(error: any, context?: any): Promise<IncidentInfo> {
    const id = this.generateIncidentId();
    const now = new Date();
    
    // Extract information from error
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const title = this.extractErrorTitle(errorMessage);
    const trigger = this.extractTrigger(error, context);
    const rootCause = this.analyzeRootCause(error, context);
    const fix = this.suggestFix(error, context);
    const impact = this.assessImpact(error, context);
    const relatedFiles = this.extractRelatedFiles(error, context);

    // Check for previous occurrences
    const recurrenceCount = await this.countPreviousOccurrences(title);

    return {
      id,
      title,
      date: now.toISOString(),
      trigger,
      rootCause,
      fix,
      impact,
      recurrenceCount,
      relatedFiles
    };
  }

  private extractErrorTitle(errorMessage: string): string {
    // Extract a clean title from error message
    const cleaned = errorMessage
      .replace(/^Error:\s*/i, '')
      .replace(/\s+at\s+.*$/, '')
      .replace(/\s+\(.*\)$/, '')
      .substring(0, 100);
    
    return cleaned || 'Unknown Error';
  }

  private extractTrigger(error: any, context?: any): string {
    if (context?.command) {
      return `Command: ${context.command}`;
    }
    if (context?.operation) {
      return `Operation: ${context.operation}`;
    }
    if (error?.stack) {
      const stackLine = error.stack.split('\n')[1];
      return stackLine ? `Code: ${stackLine.trim()}` : 'Unknown trigger';
    }
    return 'Unknown trigger';
  }

  private analyzeRootCause(error: any, context?: any): string {
    const errorMessage = error?.message || '';
    
    // Common patterns
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      return 'File or resource not found';
    }
    if (errorMessage.includes('permission denied') || errorMessage.includes('EACCES')) {
      return 'Permission denied - insufficient access rights';
    }
    if (errorMessage.includes('timeout')) {
      return 'Operation timed out - possible network or performance issue';
    }
    if (errorMessage.includes('Cannot find module')) {
      return 'Missing dependency or incorrect import path';
    }
    if (errorMessage.includes('syntax error') || errorMessage.includes('unexpected token')) {
      return 'Code syntax error';
    }
    
    return 'Root cause requires investigation';
  }

  private suggestFix(error: any, context?: any): string {
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('ENOENT')) {
      return 'Ensure the required file or directory exists before accessing it';
    }
    if (errorMessage.includes('permission denied')) {
      return 'Check file permissions or run with appropriate privileges';
    }
    if (errorMessage.includes('Cannot find module')) {
      return 'Install missing dependency or correct the import path';
    }
    if (errorMessage.includes('timeout')) {
      return 'Increase timeout value or optimize the operation';
    }
    
    return 'Investigate error details and apply appropriate fix';
  }

  private assessImpact(error: any, context?: any): 'low' | 'medium' | 'high' {
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('fatal') || errorMessage.includes('critical')) {
      return 'high';
    }
    if (context?.operation && ['build', 'deploy', 'init'].includes(context.operation)) {
      return 'high';
    }
    if (errorMessage.includes('warning')) {
      return 'low';
    }
    
    return 'medium';
  }

  private extractRelatedFiles(error: any, context?: any): string[] {
    const files: string[] = [];
    
    if (context?.files) {
      files.push(...context.files);
    }
    
    if (error?.stack) {
      const stackLines = error.stack.split('\n');
      for (const line of stackLines) {
        const fileMatch = line.match(/\((.*?):\d+:\d+\)/);
        if (fileMatch && fileMatch[1]) {
          files.push(fileMatch[1]);
        }
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  private async countPreviousOccurrences(title: string): Promise<number> {
    try {
      const incidentsPath = path.join(this.agentPath, 'incidents');
      if (!existsSync(incidentsPath)) {
        return 0;
      }

      const files = await ops.promises.readdir(incidentsPath);
      let count = 0;

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(incidentsPath, file);
          const content = await ops.promises.readFile(filePath, 'utf-8');
          if (content.includes(title)) {
            count++;
          }
        }
      }

      return Math.max(0, count - 1); // Subtract 1 for current incident
    } catch (error) {
      return 0;
    }
  }

  private generateIncidentContent(incident: IncidentInfo): string {
    return `# ${incident.title} - ${incident.date.split('T')[0]}

## 📊 Incident Summary
- **ID**: ${incident.id}
- **Date**: ${incident.date}
- **Impact**: ${incident.impact.toUpperCase()}
- **Recurrence**: ${incident.recurrenceCount > 0 ? `${incident.recurrenceCount} previous occurrences` : 'First occurrence'}

## 🔥 Trigger
${incident.trigger}

## 🔍 Root Cause
${incident.rootCause}

## ✅ Fix Applied
${incident.fix}

## 📁 Related Files
${incident.relatedFiles.length > 0 ? incident.relatedFiles.map(f => `- ${f}`).join('\n') : 'None identified'}

## 🛡️ Prevention
${incident.guardrailCreated ? `Guardrail created: ${incident.guardrailCreated}` : 'Manual prevention required'}

## 📚 Related Documentation
- [Self-Healing SOP](../sop/self-healing-workflow.md)
- [Guardrails](../guardrails/)
- [System Critical State](../system/critical-state.md)

---
*Generated by grok-one-shotSelf-Healing System*
*Incident ID: ${incident.id}*
`;
  }

  private async generateGuardrailFromIncident(incident: IncidentInfo): Promise<GuardrailRule | null> {
    // Only create guardrails for recurring issues or high-impact incidents
    if (incident.recurrenceCount === 0 && incident.impact !== 'high') {
      return null;
    }

    const id = `guard_${incident.id}`;
    const category = this.determineGuardrailCategory(incident);
    const pattern = this.createGuardrailPattern(incident);

    if (!pattern) {
      return null;
    }

    return {
      id,
      name: `Prevent: ${incident.title}`,
      description: `Automatically generated from incident ${incident.id}. ${incident.rootCause}`,
      category,
      severity: incident.impact === 'high' ? 'error' : 'warning',
      pattern,
      enabled: true,
      createdFrom: incident.id
    };
  }

  private determineGuardrailCategory(incident: IncidentInfo): GuardrailRule['category'] {
    if (incident.trigger.includes('file') || incident.trigger.includes('path')) {
      return 'configuration';
    }
    if (incident.trigger.includes('command') || incident.trigger.includes('operation')) {
      return 'process';
    }
    if (incident.relatedFiles.some(f => f.includes('src/') || f.includes('lib/'))) {
      return 'architecture';
    }
    return 'process';
  }

  private createGuardrailPattern(incident: IncidentInfo): string | null {
    // Create simple patterns based on common error types
    const errorMessage = incident.trigger.toLowerCase();
    
    if (errorMessage.includes('enoent') || errorMessage.includes('not found')) {
      return 'check_file_exists';
    }
    if (errorMessage.includes('permission')) {
      return 'check_permissions';
    }
    if (errorMessage.includes('module')) {
      return 'check_dependencies';
    }
    
    return null;
  }

  private async saveGuardrail(guardrail: GuardrailRule): Promise<void> {
    const guardrailsPath = path.join(this.agentPath, 'guardrails');
    await ops.mkdir(guardrailsPath, { recursive: true });
    
    const filePath = path.join(guardrailsPath, `${guardrail.id}.md`);
    const content = this.generateGuardrailContent(guardrail);
    await ops.promises.writeFile(filePath, content);
  }

  private generateGuardrailContent(guardrail: GuardrailRule): string {
    return `# ${guardrail.name}

## 📋 Rule Details
- **ID**: ${guardrail.id}
- **Category**: ${guardrail.category}
- **Severity**: ${guardrail.severity}
- **Status**: ${guardrail.enabled ? 'Enabled' : 'Disabled'}

## 📝 Description
${guardrail.description}

## 🔍 Pattern
\`${guardrail.pattern}\`

## 🛠️ Implementation
This guardrail checks for the following conditions:
- Pattern: ${guardrail.pattern}
- Action: ${guardrail.severity === 'error' ? 'Block operation' : 'Show warning'}

## 📚 Related
${guardrail.createdFrom ? `- Created from incident: ${guardrail.createdFrom}` : ''}
- Category: ${guardrail.category}

---
*Generated by grok-one-shotSelf-Healing System*
`;
  }

  async checkGuardrails(operation: string, context?: any): Promise<{ violations: GuardrailRule[]; warnings: GuardrailRule[]; passed: boolean }> {
    const violations: GuardrailRule[] = [];
    const warnings: GuardrailRule[] = [];

    try {
      const guardrails = await this.loadAllGuardrails();
      
      for (const guardrail of guardrails) {
        if (!guardrail.enabled) continue;

        const violated = this.checkGuardrailPattern(guardrail.pattern, operation, context);
        if (violated) {
          if (guardrail.severity === 'error') {
            violations.push(guardrail);
          } else {
            warnings.push(guardrail);
          }
        }
      }
    } catch (error) {
      // If we can't load guardrails, allow operation to proceed
    }

    return {
      violations,
      warnings,
      passed: violations.length === 0
    };
  }

  private async loadAllGuardrails(): Promise<GuardrailRule[]> {
    const guardrailsPath = path.join(this.agentPath, 'guardrails');
    if (!existsSync(guardrailsPath)) {
      return [];
    }

    const files = await ops.promises.readdir(guardrailsPath);
    const guardrails: GuardrailRule[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        try {
          const content = await ops.promises.readFile(path.join(guardrailsPath, file), 'utf-8');
          const guardrail = this.parseGuardrailFromContent(content);
          if (guardrail) {
            guardrails.push(guardrail);
          }
        } catch (error) {
          // Skip files we can't parse
        }
      }
    }

    return guardrails;
  }

  private parseGuardrailFromContent(content: string): GuardrailRule | null {
    try {
      const idMatch = content.match(/\*\*ID\*\*:\s*(.+)/);
      const nameMatch = content.match(/^#\s*(.+)/m);
      const categoryMatch = content.match(/\*\*Category\*\*:\s*(.+)/);
      const severityMatch = content.match(/\*\*Severity\*\*:\s*(.+)/);
      const statusMatch = content.match(/\*\*Status\*\*:\s*(.+)/);
      const patternMatch = content.match(/`([^`]+)`/);
      const descMatch = content.match(/## 📝 Description\n(.+)/);

      if (!idMatch || !nameMatch || !patternMatch) {
        return null;
      }

      return {
        id: idMatch[1].trim(),
        name: nameMatch[1].trim(),
        description: descMatch ? descMatch[1].trim() : '',
        category: (categoryMatch ? categoryMatch[1].trim() : 'process') as GuardrailRule['category'],
        severity: (severityMatch ? severityMatch[1].trim() : 'warning') as GuardrailRule['severity'],
        pattern: patternMatch[1],
        enabled: statusMatch ? statusMatch[1].includes('Enabled') : true
      };
    } catch (error) {
      return null;
    }
  }

  private checkGuardrailPattern(pattern: string, operation: string, context?: any): boolean {
    // Simple pattern matching - could be enhanced
    switch (pattern) {
      case 'check_file_exists':
        return context?.files && context.files.some((f: string) => !existsSync(f));
      case 'check_permissions':
        return false; // Would need actual permission check
      case 'check_dependencies':
        return false; // Would need dependency analysis
      default:
        return operation.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `incident_${timestamp}_${random}`;
  }

  async listIncidents(): Promise<IncidentInfo[]> {
    const incidentsPath = path.join(this.agentPath, 'incidents');
    if (!existsSync(incidentsPath)) {
      return [];
    }

    const files = await ops.promises.readdir(incidentsPath);
    const incidents: IncidentInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        try {
          const content = await ops.promises.readFile(path.join(incidentsPath, file), 'utf-8');
          const incident = this.parseIncidentFromContent(content);
          if (incident) {
            incidents.push(incident);
          }
        } catch (error) {
          // Skip files we can't parse
        }
      }
    }

    return incidents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private parseIncidentFromContent(content: string): IncidentInfo | null {
    // Basic parsing - could be enhanced
    try {
      const idMatch = content.match(/\*\*ID\*\*:\s*(.+)/);
      const titleMatch = content.match(/^#\s*(.+)/m);
      const dateMatch = content.match(/\*\*Date\*\*:\s*(.+)/);
      const impactMatch = content.match(/\*\*Impact\*\*:\s*(.+)/);

      if (!idMatch || !titleMatch) {
        return null;
      }

      return {
        id: idMatch[1].trim(),
        title: titleMatch[1].split(' - ')[0].trim(),
        date: dateMatch ? dateMatch[1].trim() : '',
        trigger: 'Unknown',
        rootCause: 'Unknown',
        fix: 'Unknown',
        impact: (impactMatch ? impactMatch[1].toLowerCase().trim() : 'medium') as any,
        recurrenceCount: 0,
        relatedFiles: []
      };
    } catch (error) {
      return null;
    }
  }

  getConfig(): SelfHealingConfig {
    return { ...this.config };
  }
}