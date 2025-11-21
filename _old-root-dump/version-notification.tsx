import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getCachedVersionInfo } from '../../utils/version-checker.js';
import { inkColors } from '../colors.js';

interface VersionNotificationProps {
  isVisible?: boolean;
}

export function VersionNotification({ isVisible = true }: VersionNotificationProps): React.ReactElement | null {
  const [versionInfo, setVersionInfo] = useState<{
    isUpdateAvailable: boolean;
    current: string;
    latest: string;
  } | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const info = await getCachedVersionInfo();
        if (info?.isUpdateAvailable) {
          setVersionInfo({
            isUpdateAvailable: info.isUpdateAvailable,
            current: info.current,
            latest: info.latest,
          });
        }
      } catch {
        // Silently ignore errors
      }
    };

    checkVersion();
    
    // Check every 6 hours
    const interval = setInterval(checkVersion, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !versionInfo?.isUpdateAvailable) {
    return null;
  }

  return (
    <Box marginTop={1} marginBottom={1}>
      <Box 
        borderStyle="round" 
        borderColor={inkColors.warning}
        paddingX={2}
        paddingY={0}
      >
        <Text color={inkColors.warning}>
          🔄 Update available: v{versionInfo.latest} (current: v{versionInfo.current})
        </Text>
        <Text color={inkColors.muted}> - Use '/upgrade' to update</Text>
      </Box>
    </Box>
  );
}

export default VersionNotification;