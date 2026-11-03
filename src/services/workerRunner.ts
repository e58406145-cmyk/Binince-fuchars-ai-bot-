import { AnalysisInput, runComprehensiveAnalysis } from './analysisEngine';
import { SignalResult } from '../types/crypto';

/**
 * Executes the analysis calculations inside a Web Worker.
 * If Web Workers are unavailable or restricted by browser policies,
 * executes directly on main thread seamlessly.
 */
export async function executeAnalysisInWorker(input: AnalysisInput): Promise<SignalResult> {
  return new Promise((resolve) => {
    try {
      const worker = new Worker(new URL('../workers/analysisWorker.ts', import.meta.url), {
        type: 'module',
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        // Fallback to main thread computation
        resolve(runComprehensiveAnalysis(input));
      }, 5000);

      worker.onmessage = (e: MessageEvent<{ success: boolean; result?: SignalResult; error?: string }>) => {
        clearTimeout(timeout);
        worker.terminate();
        if (e.data.success && e.data.result) {
          resolve(e.data.result);
        } else {
          resolve(runComprehensiveAnalysis(input));
        }
      };

      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(runComprehensiveAnalysis(input));
      };

      worker.postMessage(input);
    } catch {
      // Main-thread fallback
      resolve(runComprehensiveAnalysis(input));
    }
  });
}
