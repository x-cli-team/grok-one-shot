import { useState, useEffect, useCallback } from 'react';
import { uiState, UIEventType, SpinnerEvent, ProgressEvent, NotificationEvent, BackgroundActivityEvent } from '../services/ui-state.js';

/**
 * Hook for managing enhanced UI feedback components
 * Integrates with the central UI state service for coordinated feedback
 */

export interface EnhancedFeedbackState {
  spinner: SpinnerEvent | null;
  progress: Map<string, ProgressEvent>;
  notifications: NotificationEvent[];
  backgroundActivities: Map<string, BackgroundActivityEvent>;
}

export function useEnhancedFeedback() {
  const [state, setState] = useState<EnhancedFeedbackState>({
    spinner: uiState.getCurrentSpinner(),
    progress: uiState.getAllProgress(),
    notifications: uiState.getNotifications(),
    backgroundActivities: uiState.getBackgroundActivities()
  });

  // Update state when UI events occur
  useEffect(() => {
    const handleSpinnerStart = (spinner: SpinnerEvent) => {
      setState(prev => ({ ...prev, spinner }));
    };

    const handleSpinnerUpdate = (spinner: SpinnerEvent) => {
      setState(prev => ({ ...prev, spinner }));
    };

    const handleSpinnerStop = () => {
      setState(prev => ({ ...prev, spinner: null }));
    };

    const handleProgressStart = (data: { id: string } & ProgressEvent) => {
      setState(prev => {
        const newProgress = new Map(prev.progress);
        const { id, ...progress } = data;
        newProgress.set(id, progress);
        return { ...prev, progress: newProgress };
      });
    };

    const handleProgressUpdate = (data: { id: string } & ProgressEvent) => {
      setState(prev => {
        const newProgress = new Map(prev.progress);
        const { id, ...progress } = data;
        if (newProgress.has(id)) {
          newProgress.set(id, progress);
        }
        return { ...prev, progress: newProgress };
      });
    };

    const handleProgressComplete = (data: { id: string }) => {
      setState(prev => {
        const newProgress = new Map(prev.progress);
        newProgress.delete(data.id);
        return { ...prev, progress: newProgress };
      });
    };

    const handleNotificationShow = (notification: NotificationEvent) => {
      setState(prev => ({
        ...prev,
        notifications: [...prev.notifications, notification]
      }));
    };

    const handleNotificationHide = (notification: NotificationEvent) => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n !== notification)
      }));
    };

    // Register all event listeners
    uiState.on('spinner:start', handleSpinnerStart);
    uiState.on('spinner:update', handleSpinnerUpdate);
    uiState.on('spinner:stop', handleSpinnerStop);
    uiState.on('progress:start', handleProgressStart);
    uiState.on('progress:update', handleProgressUpdate);
    uiState.on('progress:complete', handleProgressComplete);
    uiState.on('notification:show', handleNotificationShow);
    uiState.on('notification:hide', handleNotificationHide);

    // Cleanup listeners
    return () => {
      uiState.off('spinner:start', handleSpinnerStart);
      uiState.off('spinner:update', handleSpinnerUpdate);
      uiState.off('spinner:stop', handleSpinnerStop);
      uiState.off('progress:start', handleProgressStart);
      uiState.off('progress:update', handleProgressUpdate);
      uiState.off('progress:complete', handleProgressComplete);
      uiState.off('notification:show', handleNotificationShow);
      uiState.off('notification:hide', handleNotificationHide);
    };
  }, []);

  // Convenience methods for triggering feedback
  const startSpinner = useCallback((operation: SpinnerEvent['operation'], message?: string) => {
    uiState.startSpinner({ operation, message });
  }, []);

  const updateSpinner = useCallback((updates: Partial<SpinnerEvent>) => {
    uiState.updateSpinner(updates);
  }, []);

  const stopSpinner = useCallback(() => {
    uiState.stopSpinner();
  }, []);

  const startProgress = useCallback((id: string, operation: ProgressEvent['operation'], total: number, message?: string) => {
    uiState.startProgress(id, {
      operation,
      current: 0,
      total,
      message
    });
  }, []);

  const updateProgress = useCallback((id: string, current: number, message?: string) => {
    uiState.updateProgress(id, { current, message });
  }, []);

  const completeProgress = useCallback((id: string) => {
    uiState.completeProgress(id);
  }, []);

  const showNotification = useCallback((message: string, type: NotificationEvent['type'] = 'info', duration?: number) => {
    uiState.showNotification({ message, type, duration });
  }, []);

  const showError = useCallback((message: string, details?: string) => {
    uiState.showError(message, details);
  }, []);

  const showSuccess = useCallback((message: string) => {
    uiState.showSuccess(message);
  }, []);

  return {
    // State
    ...state,
    
    // Spinner controls
    startSpinner,
    updateSpinner,
    stopSpinner,
    
    // Progress controls
    startProgress,
    updateProgress,
    completeProgress,
    
    // Notification controls
    showNotification,
    showError,
    showSuccess,
    
    // Convenience methods for common operations
    startWorkspaceIndexing: uiState.showWorkspaceIndexing.bind(uiState),
    updateWorkspaceIndexing: uiState.updateWorkspaceIndexing.bind(uiState),
    completeWorkspaceIndexing: uiState.completeWorkspaceIndexing.bind(uiState),
    
    startTokenCompaction: uiState.showTokenCompaction.bind(uiState),
    updateTokenCompaction: uiState.updateTokenCompaction.bind(uiState),
    completeTokenCompaction: uiState.completeTokenCompaction.bind(uiState),
  };
}

/**
 * Hook specifically for operation-aware spinners
 * Automatically determines the best spinner type based on context
 */
export function useOperationSpinner() {
  const { startSpinner, updateSpinner, stopSpinner, spinner } = useEnhancedFeedback();

  const startOperationSpinner = useCallback((operation: string, context?: { message?: string }) => {
    // Smart operation detection based on context
    let spinnerOperation: SpinnerEvent['operation'] = 'thinking';
    let message: string | undefined;

    if (operation.includes('search') || operation.includes('find')) {
      spinnerOperation = 'search';
      message = 'Searching files...';
    } else if (operation.includes('index') || operation.includes('scan')) {
      spinnerOperation = 'indexing';
      message = 'Indexing workspace...';
    } else if (operation.includes('write') || operation.includes('create')) {
      spinnerOperation = 'write';
      message = 'Writing file...';
    } else if (operation.includes('edit') || operation.includes('modify')) {
      spinnerOperation = 'edit';
      message = 'Editing file...';
    } else if (operation.includes('compact') || operation.includes('optimize')) {
      spinnerOperation = 'compact';
      message = 'Optimizing context...';
    } else if (operation.includes('analyze') || operation.includes('parse')) {
      spinnerOperation = 'analyze';
      message = 'Analyzing code...';
    } else {
      spinnerOperation = 'process';
      message = 'Processing...';
    }

    // Override with context-specific message if provided
    if (context?.message) {
      message = context.message;
    }

    startSpinner(spinnerOperation, message);
  }, [startSpinner]);

  return {
    isActive: !!spinner,
    operation: spinner?.operation,
    message: spinner?.message,
    progress: spinner?.progress,
    startOperationSpinner,
    updateSpinner,
    stopSpinner
  };
}

/**
 * Hook for background activity indicators
 * Manages subtle, non-intrusive background process indicators
 */
export function useBackgroundActivity() {
  const [activities, setActivities] = useState(uiState.getBackgroundActivities());

  useEffect(() => {
    const updateActivities = () => {
      setActivities(new Map(uiState.getBackgroundActivities()));
    };

    // Listen for background activity events
    const events: UIEventType[] = [
      'background:indexing:start',
      'background:indexing:progress', 
      'background:indexing:complete',
      'background:watching:start',
      'background:watching:update',
      'background:watching:stop',
      'background:compacting:start',
      'background:compacting:progress',
      'background:compacting:complete'
    ];

    events.forEach(event => {
      uiState.on(event, updateActivities);
    });

    return () => {
      events.forEach(event => {
        uiState.off(event, updateActivities);
      });
    };
  }, []);

  const hasActiveIndexing = Array.from(activities.values()).some(activity => activity.activity === 'indexing');
  const hasActiveWatching = Array.from(activities.values()).some(activity => activity.activity === 'watching');
  const hasActiveCompacting = Array.from(activities.values()).some(activity => activity.activity === 'syncing');

  return {
    activities,
    hasActiveIndexing,
    hasActiveWatching,
    hasActiveCompacting,
    hasAnyActivity: activities.size > 0
  };
}