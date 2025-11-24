import { useEffect, useRef } from 'react';

export function useProcessingTimer(
  isProcessing: boolean,
  isStreaming: boolean,
  setProcessingTime: (time: number) => void
): void {
  const processingStartTime = useRef<number>(0);

  useEffect(() => {
    if (!isProcessing && !isStreaming) {
      setProcessingTime(0);
      return;
    }

    if (processingStartTime.current === 0) {
      processingStartTime.current = Date.now();
    }

    const interval = setInterval(() => {
      setProcessingTime(
        Math.floor((Date.now() - processingStartTime.current) / 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, isStreaming, setProcessingTime]);
}