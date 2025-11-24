// Logger utility for CLI
export function log(message: string) {
  console.log(`[CLI] ${message}`);
}

export function error(message: string) {
  console.error(`[CLI ERROR] ${message}`);
}