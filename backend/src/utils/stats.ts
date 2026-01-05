// src/utils/stats.ts
// Simple in‑memory statistics used by the server for analytics and health checks.
// This placeholder satisfies the imports required by `server.ts`.

export const stats = {
  totalRequests: 0,
  requestsPerSecond: 0,
  errorCount: 0,
  lastRequestTime: 0,
};

// Optional helper to record a request (not used in current code but handy)
export const recordRequest = (durationMs: number) => {
  stats.totalRequests += 1;
  stats.lastRequestTime = durationMs;
  // Increment RPS counter – reset elsewhere every second
  stats.requestsPerSecond += 1;
};
