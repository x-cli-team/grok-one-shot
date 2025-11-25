import { EventEmitter } from 'events';

/**
 * Central event bus for UI state management and component coordination
 * Enables communication between different UI components and background processes
 */

export interface UIEvent {
  type: UIEventType;
  data: unknown;
  timestamp: number;
}

export type UIEventType = 
  // Spinner and progress events
  | 'spinner:start'
  | 'spinner:stop'
  | 'spinner:update'
  | 'progress:start'
  | 'progress:update'
  | 'progress:complete'
  
  // Background activity events
  | 'background:indexing:start'
  | 'background:indexing:progress'
  | 'background:indexing:complete'
  | 'background:watching:start'
  | 'background:watching:update'
  | 'background:watching:stop'
  | 'background:compacting:start'
  | 'background:compacting:progress'
  | 'background:compacting:complete'
  
  // Context and workspace events
  | 'workspace:scan:start'
  | 'workspace:scan:progress'
  | 'workspace:scan:complete'
  | 'context:compaction:start'
  | 'context:compaction:progress'
  | 'context:compaction:complete'
  | 'session:restore:start'
  | 'session:restore:complete'
  
  // Notification events
  | 'notification:show'
  | 'notification:hide'
  | 'notification:error'
  | 'notification:success';

export interface SpinnerEvent {
  operation: 'thinking' | 'search' | 'indexing' | 'write' | 'edit' | 'compact' | 'analyze' | 'process';
  message?: string;
  progress?: number;
}

export interface ProgressEvent {
  operation: 'compacting' | 'indexing' | 'analyzing' | 'optimizing';
  current: number;
  total: number;
  message?: string;
  startTime?: number;
}

export interface BackgroundActivityEvent {
  activity: 'indexing' | 'watching' | 'syncing' | 'caching';
  details?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export interface NotificationEvent {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  duration?: number;
}

class UIStateService extends EventEmitter {
  private static instance: UIStateService;
  private currentSpinner: SpinnerEvent | null = null;
  private activeProgress: Map<string, ProgressEvent> = new Map();
  private backgroundActivities: Map<string, BackgroundActivityEvent> = new Map();
  private notifications: NotificationEvent[] = [];

  private constructor() {
    super();
    this.setMaxListeners(50); // Allow many components to listen
  }

  static getInstance(): UIStateService {
    if (!UIStateService.instance) {
      UIStateService.instance = new UIStateService();
    }
    return UIStateService.instance;
  }

  // Spinner management
  startSpinner(event: SpinnerEvent) {
    this.currentSpinner = event;
    this.emit('spinner:start', event);
  }

  updateSpinner(updates: Partial<SpinnerEvent>) {
    if (this.currentSpinner) {
      this.currentSpinner = { ...this.currentSpinner, ...updates };
      this.emit('spinner:update', this.currentSpinner);
    }
  }

  stopSpinner() {
    this.currentSpinner = null;
    this.emit('spinner:stop');
  }

  getCurrentSpinner(): SpinnerEvent | null {
    return this.currentSpinner;
  }

  // Progress management
  startProgress(id: string, event: ProgressEvent) {
    this.activeProgress.set(id, { ...event, startTime: event.startTime || Date.now() });
    this.emit('progress:start', { id, ...event });
  }

  updateProgress(id: string, updates: Partial<ProgressEvent>) {
    const existing = this.activeProgress.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.activeProgress.set(id, updated);
      this.emit('progress:update', { id, ...updated });
    }
  }

  completeProgress(id: string) {
    const progress = this.activeProgress.get(id);
    if (progress) {
      this.activeProgress.delete(id);
      this.emit('progress:complete', { id, ...progress });
    }
  }

  getProgress(id: string): ProgressEvent | undefined {
    return this.activeProgress.get(id);
  }

  getAllProgress(): Map<string, ProgressEvent> {
    return new Map(this.activeProgress);
  }

  // Background activity management
  startBackgroundActivity(id: string, event: BackgroundActivityEvent) {
    this.backgroundActivities.set(id, event);
    const eventType = `background:${event.activity}:start` as UIEventType;
    this.emit(eventType, { id, ...event });
  }

  updateBackgroundActivity(id: string, updates: Partial<BackgroundActivityEvent>) {
    const existing = this.backgroundActivities.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.backgroundActivities.set(id, updated);
      const eventType = `background:${updated.activity}:progress` as UIEventType;
      this.emit(eventType, { id, ...updated });
    }
  }

  stopBackgroundActivity(id: string) {
    const activity = this.backgroundActivities.get(id);
    if (activity) {
      this.backgroundActivities.delete(id);
      const eventType = `background:${activity.activity}:complete` as UIEventType;
      this.emit(eventType, { id, ...activity });
    }
  }

  getBackgroundActivities(): Map<string, BackgroundActivityEvent> {
    return new Map(this.backgroundActivities);
  }

  // Notification management
  showNotification(notification: NotificationEvent) {
    this.notifications.push(notification);
    this.emit('notification:show', notification);
    
    // Auto-dismiss if duration is specified
    if (notification.duration) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, notification.duration);
    }
  }

  hideNotification(notification: NotificationEvent) {
    const index = this.notifications.indexOf(notification);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.emit('notification:hide', notification);
    }
  }

  getNotifications(): NotificationEvent[] {
    return [...this.notifications];
  }

  // Convenience methods for common operations
  showWorkspaceIndexing(totalFiles: number, currentFile?: string) {
    this.startProgress('workspace-indexing', {
      operation: 'indexing',
      current: 0,
      total: totalFiles,
      message: currentFile ? `Indexing ${currentFile}` : 'Indexing workspace'
    });

    this.startBackgroundActivity('workspace-watcher', {
      activity: 'indexing',
      details: `0/${totalFiles} files`
    });
  }

  updateWorkspaceIndexing(current: number, total: number, currentFile?: string) {
    this.updateProgress('workspace-indexing', {
      current,
      message: currentFile ? `Indexing ${currentFile}` : undefined
    });

    this.updateBackgroundActivity('workspace-watcher', {
      details: `${current}/${total} files`
    });
  }

  completeWorkspaceIndexing() {
    this.completeProgress('workspace-indexing');
    this.stopBackgroundActivity('workspace-watcher');
    this.showNotification({
      message: 'Workspace indexing complete',
      type: 'success',
      icon: '✅',
      duration: 3000
    });
  }

  showTokenCompaction(usedTokens: number, targetTokens: number) {
    this.startSpinner({
      operation: 'compact',
      message: `Compacting context (${usedTokens}→${targetTokens} tokens)`
    });

    this.startProgress('token-compaction', {
      operation: 'compacting',
      current: 0,
      total: usedTokens
    });
  }

  updateTokenCompaction(compactedTokens: number) {
    this.updateProgress('token-compaction', {
      current: compactedTokens
    });

    const progress = this.getProgress('token-compaction');
    if (progress) {
      const percentage = Math.round((compactedTokens / progress.total) * 100);
      this.updateSpinner({
        progress: percentage
      });
    }
  }

  completeTokenCompaction() {
    this.completeProgress('token-compaction');
    this.stopSpinner();
    this.showNotification({
      message: 'Context compaction complete',
      type: 'success',
      icon: '🔄',
      duration: 2000
    });
  }

  // Error handling
  showError(message: string, details?: string) {
    this.showNotification({
      message: details ? `${message}: ${details}` : message,
      type: 'error',
      icon: '❌',
      duration: 5000
    });
  }

  showSuccess(message: string) {
    this.showNotification({
      message,
      type: 'success',
      icon: '✅',
      duration: 3000
    });
  }

  showInfo(message: string) {
    this.showNotification({
      message,
      type: 'info',
      icon: 'ℹ️',
      duration: 4000
    });
  }

  // Debug helpers
  getState() {
    return {
      spinner: this.currentSpinner,
      progress: Object.fromEntries(this.activeProgress),
      backgroundActivities: Object.fromEntries(this.backgroundActivities),
      notifications: this.notifications
    };
  }

  reset() {
    this.currentSpinner = null;
    this.activeProgress.clear();
    this.backgroundActivities.clear();
    this.notifications = [];
    this.emit('ui:reset');
  }
}

// Export singleton instance
export const uiState = UIStateService.getInstance();

// Export convenience hooks for React components
export function useUIState() {
  return uiState;
}

// Type-safe event listener helpers
export function onUIEvent<T = unknown>(eventType: UIEventType, listener: (data: T) => void) {
  uiState.on(eventType, listener);
  return () => uiState.off(eventType, listener);
}