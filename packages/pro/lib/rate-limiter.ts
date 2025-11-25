// Rate limiter for Pro features
export class RateLimiter {
  private requests: number[] = [];

  checkLimit(maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < windowMs);
    if (this.requests.length >= maxRequests) {
      return false;
    }
    this.requests.push(now);
    return true;
  }
}