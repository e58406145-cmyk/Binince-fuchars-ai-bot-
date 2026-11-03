/**
 * Dedicated Web Worker for wall-clock trade timing.
 * Runs independently of main-thread UI rendering and maintains
 * background execution ticks when tab is unfocused.
 */

let timerId: any = null;

self.onmessage = (e: MessageEvent<{ command: 'start' | 'stop'; intervalMs?: number }>) => {
  const { command, intervalMs = 500 } = e.data;

  if (command === 'start') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'TICK', now: Date.now() });
    }, intervalMs);
  } else if (command === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
