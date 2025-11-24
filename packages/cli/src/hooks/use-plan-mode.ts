/**
 * Plan Mode State Management Hook
 * 
 * Manages the state and lifecycle of Claude Code's Plan Mode feature.
 * Handles activation, phase transitions, and state persistence.
 */

import { useState, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';
import {
  PlanModeState,
  PlanModePhase,
  PlanModeEvents,
  PlanModeActivationOptions,
  ImplementationPlan,
  ExplorationData,
  PlanModeSettings
} from '../types/plan-mode.js';
import { CodebaseExplorer } from '../services/codebase-explorer.js';
import { PlanGenerator } from '../services/plan-generator.js';
import { ReadOnlyToolExecutor } from '../services/read-only-tool-executor.js';
import { PlanApprovalManager, ApprovalResult } from '../services/plan-approval-manager.js';
import { GrokAgent } from '../agent/grok-agent.js';
import { PlanModeActivationOrchestrator } from '../services/plan-mode-activation-orchestrator.js';
import { ReadOnlyFilesystemOverlay } from '../services/readonly-filesystem-overlay.js';

// Default plan mode settings
const DEFAULT_SETTINGS: PlanModeSettings = {
  maxExplorationDepth: 5,
  maxFileSize: 1024 * 1024, // 1MB
  planGenerationTimeout: 30000, // 30 seconds
  enableDetailedLogging: true,
  autoSavePlans: true,
  planSaveDirectory: '.grok/plans'
};

// Initial plan mode state
const INITIAL_STATE: PlanModeState = {
  active: false,
  phase: 'inactive',
  currentPlan: null,
  userApproval: false,
  explorationData: null,
  sessionStartTime: null
};

/**
 * Custom hook for managing plan mode state and operations
 */
export function usePlanMode(settings: Partial<PlanModeSettings> = {}, agent?: GrokAgent) {
  const [state, setState] = useState<PlanModeState>(INITIAL_STATE);
  const [eventEmitter] = useState(() => new EventEmitter());
  const [mergedSettings] = useState<PlanModeSettings>({ ...DEFAULT_SETTINGS, ...settings });
  
  // Initialize services when agent is available
  const [codebaseExplorer] = useState(() => 
    agent ? new CodebaseExplorer(mergedSettings) : null
  );
  const [planGenerator] = useState(() => 
    agent ? new PlanGenerator(agent) : null
  );
  const [readOnlyExecutor] = useState(() => 
    agent ? new ReadOnlyToolExecutor(agent) : null
  );
  const [approvalManager] = useState(() => 
    agent && planGenerator ? new PlanApprovalManager(agent, planGenerator) : null
  );
  const [activationOrchestrator] = useState(() => 
    agent ? new PlanModeActivationOrchestrator({}) : null
  );
  const [readonlyOverlay] = useState(() => 
    agent ? new ReadOnlyFilesystemOverlay() : null
  );

  // Emit events for state changes
  const emitEvent = useCallback(<K extends keyof PlanModeEvents>(
    event: K,
    data: PlanModeEvents[K]
  ) => {
    eventEmitter.emit(event, data);
    
    // Log events if detailed logging is enabled
    if (mergedSettings.enableDetailedLogging) {
      console.log(`[PlanMode] ${event}:`, data);
    }
  }, [eventEmitter, mergedSettings.enableDetailedLogging]);

  // Activate plan mode
  const activatePlanMode = useCallback(async (options: PlanModeActivationOptions = {}, chatSetter?: (setter: (prev: any[]) => any[]) => void) => {
    if (state.active) {
      console.warn('[PlanMode] Already active, ignoring activation request');
      return false;
    }

    // Setup agent integration
    if (agent && readonlyOverlay && activationOrchestrator) {
      agent.setReadonlyOverlay(readonlyOverlay);
      agent.setPlanModeState({
        ...INITIAL_STATE,
        active: true,
        phase: 'analysis',
        sessionStartTime: new Date()
      });
    }

    const newState: PlanModeState = {
      ...INITIAL_STATE,
      active: true,
      phase: 'analysis',
      sessionStartTime: new Date()
    };

    setState(newState);
    emitEvent('plan-mode-activated', { timestamp: new Date() });
    emitEvent('phase-changed', { 
      from: 'inactive', 
      to: 'analysis', 
      timestamp: new Date() 
    });

    // Use orchestrator for comprehensive activation if available
    if (activationOrchestrator) {
      try {
        await activationOrchestrator.activatePlanMode(options, chatSetter);
      } catch (error) {
        console.error('[PlanMode] Orchestrator activation failed:', error);
        // Fall back to basic activation
      }
    }

    return true;
  }, [state.active, emitEvent, agent, readonlyOverlay, activationOrchestrator]);

  // Deactivate plan mode
  const deactivatePlanMode = useCallback((reason: string = 'user_requested') => {
    if (!state.active) {
      return;
    }

    // Clean up agent integration
    if (agent) {
      agent.setPlanModeState(null);
      agent.setReadonlyOverlay(null);
    }

    setState(INITIAL_STATE);
    emitEvent('plan-mode-deactivated', { timestamp: new Date(), reason });
    emitEvent('phase-changed', { 
      from: state.phase, 
      to: 'inactive', 
      timestamp: new Date() 
    });
  }, [state.active, state.phase, emitEvent, agent]);

  // Change phase within plan mode
  const changePhase = useCallback((newPhase: PlanModePhase) => {
    if (!state.active || state.phase === newPhase) {
      return;
    }

    const oldPhase = state.phase;
    setState(prev => ({ ...prev, phase: newPhase }));
    emitEvent('phase-changed', { 
      from: oldPhase, 
      to: newPhase, 
      timestamp: new Date() 
    });
  }, [state.active, state.phase, emitEvent]);

  // Update exploration data
  const updateExplorationData = useCallback((data: ExplorationData) => {
    setState(prev => ({ ...prev, explorationData: data }));
    
    // Emit progress event
    const progress = data.exploredPaths.length / (mergedSettings.maxExplorationDepth * 10); // Rough progress calculation
    emitEvent('exploration-progress', { 
      progress: Math.min(progress, 1), 
      currentPath: data.exploredPaths[data.exploredPaths.length - 1] || ''
    });
  }, [emitEvent, mergedSettings.maxExplorationDepth]);

  // Set implementation plan
  const setImplementationPlan = useCallback((plan: ImplementationPlan) => {
    setState(prev => ({ ...prev, currentPlan: plan }));
    emitEvent('plan-generated', { plan, timestamp: new Date() });
    
    // Auto-save plan if enabled
    if (mergedSettings.autoSavePlans) {
      // TODO: Implement plan saving to filesystem
      console.log('[PlanMode] Auto-saving plan:', plan.title);
    }
  }, [emitEvent, mergedSettings.autoSavePlans]);

  // Approve current plan
  const approvePlan = useCallback(() => {
    if (!state.currentPlan) {
      console.warn('[PlanMode] No plan to approve');
      return false;
    }

    setState(prev => ({ ...prev, userApproval: true, phase: 'approved' }));
    emitEvent('plan-approved', { plan: state.currentPlan, timestamp: new Date() });
    return true;
  }, [state.currentPlan, emitEvent]);

  // Reject current plan
  const rejectPlan = useCallback((reason: string = 'user_rejected') => {
    if (!state.currentPlan) {
      console.warn('[PlanMode] No plan to reject');
      return false;
    }

    setState(prev => ({ ...prev, userApproval: false, phase: 'rejected' }));
    emitEvent('plan-rejected', { 
      plan: state.currentPlan, 
      reason, 
      timestamp: new Date() 
    });
    return true;
  }, [state.currentPlan, emitEvent]);

  // Start execution of approved plan
  const startExecution = useCallback(() => {
    if (!state.currentPlan || !state.userApproval) {
      console.warn('[PlanMode] Cannot start execution: no approved plan');
      return false;
    }

    emitEvent('execution-started', { plan: state.currentPlan, timestamp: new Date() });
    
    // Deactivate plan mode when execution starts
    deactivatePlanMode('execution_started');
    return true;
  }, [state.currentPlan, state.userApproval, emitEvent, deactivatePlanMode]);

  // Start codebase exploration
  const startExploration = useCallback(async (userRequest?: string) => {
    if (!codebaseExplorer || !state.active) {
      console.warn('[PlanMode] Cannot start exploration: explorer not available or plan mode not active');
      return false;
    }

    try {
      changePhase('analysis');
      
      const explorationData = await codebaseExplorer.exploreCodebase({
        rootPath: process.cwd(),
        maxDepth: mergedSettings.maxExplorationDepth,
        maxFileSize: mergedSettings.maxFileSize
      });

      updateExplorationData(explorationData);
      
      // If we have a user request, automatically proceed to strategy generation
      if (userRequest && planGenerator) {
        await generatePlan(userRequest);
      } else {
        changePhase('strategy');
      }
      
      return true;
    } catch (error) {
      console.error('[PlanMode] Exploration failed:', error);
      return false;
    }
  }, [codebaseExplorer, state.active, changePhase, updateExplorationData, mergedSettings, planGenerator]);

  // Generate implementation plan with strategy options
  const generatePlan = useCallback(async (userRequest: string) => {
    if (!planGenerator || !state.explorationData) {
      console.warn('[PlanMode] Cannot generate plan: generator not available or no exploration data');
      return false;
    }

    try {
      changePhase('strategy');
      
      const plan = await planGenerator.generatePlan({
        userRequest,
        explorationData: state.explorationData
      });

      setImplementationPlan(plan);
      changePhase('presentation');
      
      return true;
    } catch (error) {
      console.error('[PlanMode] Plan generation failed:', error);
      return false;
    }
  }, [planGenerator, state.explorationData, changePhase, setImplementationPlan]);

  // Handle plan approval result
  const handlePlanApproval = useCallback((result: ApprovalResult) => {
    if (result.decision === 'approved') {
      setState(prev => ({ ...prev, userApproval: true, phase: 'approved' }));
      emitEvent('plan-approved', { plan: state.currentPlan!, timestamp: new Date() });
    } else if (result.decision === 'rejected') {
      setState(prev => ({ ...prev, userApproval: false, phase: 'rejected' }));
      emitEvent('plan-rejected', { 
        plan: state.currentPlan!, 
        reason: result.feedback || 'User rejected plan', 
        timestamp: new Date() 
      });
    }
  }, [state.currentPlan, emitEvent]);

  // Handle plan revision
  const handlePlanRevision = useCallback((revisedPlan: ImplementationPlan) => {
    setImplementationPlan(revisedPlan);
    // Stay in presentation phase for revised plan review
  }, [setImplementationPlan]);

  // Execute tool in read-only mode
  const executeReadOnlyTool = useCallback(async (toolName: string, args: any) => {
    if (!readOnlyExecutor) {
      console.warn('[PlanMode] Read-only executor not available');
      return null;
    }

    return await readOnlyExecutor.executeReadOnly(toolName, args);
  }, [readOnlyExecutor]);

  // Subscribe to events
  const onEvent = useCallback(<K extends keyof PlanModeEvents>(
    event: K,
    listener: (data: PlanModeEvents[K]) => void
  ) => {
    eventEmitter.on(event, listener);
    return () => eventEmitter.off(event, listener);
  }, [eventEmitter]);

  // Get session duration
  const getSessionDuration = useCallback(() => {
    if (!state.sessionStartTime) return 0;
    return Date.now() - state.sessionStartTime.getTime();
  }, [state.sessionStartTime]);

  // Check if plan mode is in a specific phase
  const isInPhase = useCallback((phase: PlanModePhase) => {
    return state.active && state.phase === phase;
  }, [state.active, state.phase]);

  // Get current progress percentage
  const getProgress = useCallback(() => {
    switch (state.phase) {
      case 'inactive':
        return 0;
      case 'analysis':
        // Progress based on exploration data
        if (!state.explorationData) return 0.1;
        return Math.min(0.4, 0.1 + (state.explorationData.exploredPaths.length / 20) * 0.3);
      case 'strategy':
        return 0.5;
      case 'presentation':
        return 0.8;
      case 'approved':
      case 'rejected':
        return 1.0;
      default:
        return 0;
    }
  }, [state.phase, state.explorationData]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.active) {
        deactivatePlanMode('component_unmount');
      }
    };
  }, [state.active, deactivatePlanMode]);

  return {
    // State
    state,
    settings: mergedSettings,
    
    // Computed properties
    isActive: state.active,
    currentPhase: state.phase,
    hasApprovedPlan: state.userApproval && !!state.currentPlan,
    sessionDuration: getSessionDuration(),
    progress: getProgress(),
    
    // Actions
    activatePlanMode,
    deactivatePlanMode,
    changePhase,
    updateExplorationData,
    setImplementationPlan,
    approvePlan,
    rejectPlan,
    startExecution,
    
    // Plan Mode specific actions
    startExploration,
    generatePlan,
    executeReadOnlyTool,
    
    // Enhanced approval workflow
    handlePlanApproval,
    handlePlanRevision,
    
    // Utilities
    onEvent,
    isInPhase,
    
    // Data accessors
    explorationData: state.explorationData,
    currentPlan: state.currentPlan,
    
    // Service accessors
    readOnlyExecutor,
    approvalManager,
    planGenerator
  };
}