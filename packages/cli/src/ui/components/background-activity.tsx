import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { inkColors } from "../colors.js";

interface BackgroundActivityProps {
  isActive: boolean;
  activity: 'indexing' | 'watching' | 'syncing' | 'caching';
  details?: string;
  position?: 'corner' | 'inline';
}

export function BackgroundActivity({
  isActive,
  activity,
  details,
  position = 'corner'
}: BackgroundActivityProps) {
  const [pulseState, setPulseState] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setPulseState(prev => (prev + 1) % 3); // 3-state pulse
    }, 1500); // 1.5s breathing rhythm

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  // Activity configuration
  const activityConfig = {
    indexing: {
      icon: '📂',
      message: 'Indexing workspace',
      color: inkColors.info
    },
    watching: {
      icon: '👁️',
      message: 'Watching files',
      color: inkColors.success
    },
    syncing: {
      icon: '🔄',
      message: 'Syncing changes',
      color: inkColors.warning
    },
    caching: {
      icon: '💾',
      message: 'Building cache',
      color: inkColors.accent
    }
  };

  const config = activityConfig[activity];
  
  // Pulse effect for subtle breathing
  const getPulseOpacity = () => {
    switch (pulseState) {
      case 0: return inkColors.muted;
      case 1: return config.color;
      case 2: return inkColors.muted;
      default: return inkColors.muted;
    }
  };

  const displayMessage = details ? `${config.message} · ${details}` : config.message;

  // Corner positioning (subtle, non-intrusive)
  // Note: Ink doesn't support absolute positioning, so we'll use inline with muted styling
  if (position === 'corner') {
    return (
      <Box marginTop={1} justifyContent="flex-end">
        <Text color={getPulseOpacity()}>
          {config.icon} {displayMessage}...
        </Text>
      </Box>
    );
  }

  // Inline positioning (part of the flow)
  return (
    <Box marginTop={1}>
      <Text color={getPulseOpacity()}>
        {config.icon} {displayMessage}...
      </Text>
    </Box>
  );
}

// Specialized components for different background activities

interface WorkspaceWatcherProps {
  isActive: boolean;
  filesAdded?: number;
  filesChanged?: number;
  filesRemoved?: number;
}

export function WorkspaceWatcher({
  isActive,
  filesAdded = 0,
  filesChanged = 0,
  filesRemoved = 0
}: WorkspaceWatcherProps) {
  if (!isActive) return null;

  let details = '';
  if (filesAdded > 0) details += `+${filesAdded} `;
  if (filesChanged > 0) details += `~${filesChanged} `;
  if (filesRemoved > 0) details += `-${filesRemoved} `;
  
  return (
    <BackgroundActivity
      isActive={isActive}
      activity="watching"
      details={details.trim() || undefined}
      position="corner"
    />
  );
}

interface IndexingPulseProps {
  isActive: boolean;
  currentFile?: string;
  totalFiles?: number;
  indexedFiles?: number;
}

export function IndexingPulse({
  isActive,
  currentFile,
  totalFiles = 0,
  indexedFiles = 0
}: IndexingPulseProps) {
  if (!isActive) return null;

  let details = '';
  if (totalFiles > 0) {
    details = `${indexedFiles}/${totalFiles} files`;
  } else if (currentFile) {
    details = currentFile.split('/').pop() || '';
  }

  return (
    <BackgroundActivity
      isActive={isActive}
      activity="indexing"
      details={details}
      position="corner"
    />
  );
}

interface ContextSyncProps {
  isActive: boolean;
  operation: 'compacting' | 'refreshing' | 'updating';
  progress?: number;
}

export function ContextSync({
  isActive,
  operation,
  progress
}: ContextSyncProps) {
  if (!isActive) return null;

  const operationMessages = {
    compacting: 'Compacting context',
    refreshing: 'Refreshing memory',
    updating: 'Updating cache'
  };

  let details = operationMessages[operation];
  if (progress !== undefined) {
    details += ` ${progress}%`;
  }

  return (
    <BackgroundActivity
      isActive={isActive}
      activity="syncing"
      details={details}
      position="inline"
    />
  );
}

// Notification-style activity indicator for important events
interface ActivityNotificationProps {
  isVisible: boolean;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  duration?: number; // auto-hide after duration (ms)
  onDismiss?: () => void;
}

export function ActivityNotification({
  isVisible,
  message,
  type,
  icon,
  duration,
  onDismiss
}: ActivityNotificationProps) {
  useEffect(() => {
    if (!isVisible || !duration || !onDismiss) return;

    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  const typeConfig = {
    info: { color: inkColors.info, defaultIcon: 'ℹ️' },
    success: { color: inkColors.success, defaultIcon: '✅' },
    warning: { color: inkColors.warning, defaultIcon: '⚠️' },
    error: { color: inkColors.error, defaultIcon: '❌' }
  };

  const config = typeConfig[type];
  const displayIcon = icon || config.defaultIcon;

  return (
    <Box marginTop={1} marginBottom={1}>
      <Text color={config.color}>
        {displayIcon} {message}
      </Text>
    </Box>
  );
}