/**
 * Debug logging utility - logs only when DEBUG=1
 */

const isDebugEnabled = () => process.env.DEBUG === '1';

const seenLabels = new Set<string>();

export function debugLog(message: string, ...args: any[]) {
  if (isDebugEnabled()) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

export function debugTime(label: string) {
  if (isDebugEnabled()) {
    // Collapse repetitive labels
    if (seenLabels.has(label)) {
      return; // Skip duplicate
    }
    seenLabels.add(label);
    console.time(label);
  }
}

export function debugTimeEnd(label: string) {
  if (isDebugEnabled()) {
    console.timeEnd(label);
    seenLabels.delete(label);
  }
}

export function cpuLog(message: string, ...args: any[]) {
  if (isDebugEnabled()) {
    console.log(`[CPU-LOG] ${message}`, ...args);
  }
}

export function perTokenLog(message: string, ...args: any[]) {
  if (isDebugEnabled()) {
    console.log(`[PER-TOKEN] ${message}`, ...args);
  }
}

export function toolQueueLog(message: string, ...args: any[]) {
  if (isDebugEnabled()) {
    console.log(`[TOOL-QUEUE] ${message}`, ...args);
  }
}