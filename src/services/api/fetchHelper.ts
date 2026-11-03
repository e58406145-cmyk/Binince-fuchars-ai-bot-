/**
 * Resilient fetch helper for crypto exchange public & private REST endpoints
 * - Enforces daily API request limit (333 requests/day)
 * - Safe GET retry mechanism (Max 3 attempts with 3s, 4s, 5s delays)
 * - Handles HTTP 401, 403, 429, timeouts, and network errors
 * - Tries direct public URL first, falls back seamlessly to Vite reverse-proxy
 */

import { checkDailyApiLimitExceeded, incrementDailyApiCounter } from './apiCredentials';

export async function fetchWithFallback<T>(directUrl: string, proxyPath: string, options?: RequestInit): Promise<T> {
  // Check daily request limit
  if (checkDailyApiLimitExceeded()) {
    throw new Error('Daily API request limit reached (333 requests/day). Market-data requests paused until daily reset.');
  }

  incrementDailyApiCounter(1);

  const maxAttempts = 3;
  const retryDelaysMs = [3000, 4000, 5000];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      // Strategy 1: Direct Request
      const res = await fetch(directUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...(options?.headers || {}),
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return (await res.json()) as T;
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelaysMs[attempt - 1] || 5000;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
      }

      if (res.status === 401) {
        throw new Error('API Authentication Error (401): Credentials missing, invalid, or expired.');
      }

      if (res.status === 403) {
        throw new Error('API Permission Error (403): Request forbidden by exchange or IP restricted.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Strategy 2: Proxy Request Fallback
      if (attempt === 1) {
        const proxyController = new AbortController();
        const proxyTimeoutId = setTimeout(() => proxyController.abort(), 9000);
        try {
          const proxyRes = await fetch(proxyPath, {
            ...options,
            signal: proxyController.signal,
            headers: {
              'Accept': 'application/json',
              ...(options?.headers || {}),
            },
          });
          clearTimeout(proxyTimeoutId);

          if (proxyRes.ok) {
            return (await proxyRes.json()) as T;
          }
        } catch {
          clearTimeout(proxyTimeoutId);
        }
      }

      if (attempt < maxAttempts) {
        const delay = retryDelaysMs[attempt - 1] || 4000;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error('Failed to complete request after maximum retry attempts.');
}
