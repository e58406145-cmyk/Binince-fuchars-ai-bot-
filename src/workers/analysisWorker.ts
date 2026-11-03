import { runComprehensiveAnalysis, AnalysisInput } from '../services/analysisEngine';

self.onmessage = (e: MessageEvent<AnalysisInput>) => {
  try {
    const result = runComprehensiveAnalysis(e.data);
    self.postMessage({ success: true, result });
  } catch (err: any) {
    self.postMessage({ success: false, error: err?.message || 'Worker computation error' });
  }
};
