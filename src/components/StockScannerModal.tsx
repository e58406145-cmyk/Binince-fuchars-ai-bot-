import React from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Volume2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StockSignalResult } from '../types/stocks';

interface StockScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScanning: boolean;
  scanProgress: { current: number; total: number; currentTicker?: string };
  rankedResults: StockSignalResult[];
  onSelectStockResult: (result: StockSignalResult) => void;
}

export const StockScannerModal: React.FC<StockScannerModalProps> = ({
  isOpen,
  onClose,
  isScanning,
  scanProgress,
  rankedResults,
  onSelectStockResult
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-600 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Stock Market Scanner</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  TOP 5 RANKED
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {isScanning 
                  ? `Scanning ${scanProgress.current} of ${scanProgress.total} stocks...` 
                  : `Scan complete • Top ${rankedResults.length} opportunities`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanning Progress Bar */}
        {isScanning && (
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span>Evaluating technical engine & strict rules...</span>
              <span>{Math.round((scanProgress.current / Math.max(1, scanProgress.total)) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                style={{ width: `${(scanProgress.current / Math.max(1, scanProgress.total)) * 100}%` }}
              />
            </div>
            {scanProgress.currentTicker && (
              <div className="text-[11px] font-mono text-slate-400 truncate">
                Inspecting ticker: <span className="text-cyan-400 font-bold">{scanProgress.currentTicker}</span>
              </div>
            )}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {rankedResults.length === 0 && !isScanning ? (
            <div className="p-8 text-center space-y-2 font-mono">
              <div className="text-sm font-bold text-amber-400">NO TRADE: No stock meets the criteria right now</div>
              <div className="text-xs text-slate-400">
                All inspected constituents were filtered out by Strict Mode or low agreement score. The engine never forces a pick.
              </div>
            </div>
          ) : (
            rankedResults.slice(0, 5).map((stock, idx) => {
              const isBuy = stock.signal === 'BUY';
              const isSell = stock.signal === 'SELL';

              return (
                <div
                  key={stock.id}
                  onClick={() => {
                    onSelectStockResult(stock);
                    onClose();
                  }}
                  className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500/70 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer transition shadow-md hover:bg-slate-900"
                >
                  {/* Top line: Rank + Ticker + Name + Signal Badge + Agreement Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <span>{stock.ticker}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({stock.companyName})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {stock.sector}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                        isBuy ? 'bg-emerald-500 text-slate-950' : isSell ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                      }`}>
                        {stock.signal}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-cyan-300 font-mono">{stock.agreementScore}/100</div>
                        <div className="text-[9px] text-slate-500 font-mono">Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing row */}
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-900/60 p-2 rounded-xl text-[10px] font-mono text-center">
                    <div>
                      <div className="text-slate-500">ENTRY</div>
                      <div className="font-bold text-white">{stock.currencySymbol}{stock.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">STOP</div>
                      <div className="font-bold text-rose-400">{stock.currencySymbol}{stock.stopLoss}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">TARGET 2</div>
                      <div className="font-bold text-emerald-400">{stock.currencySymbol}{stock.targetPrice2}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">R:R</div>
                      <div className="font-bold text-cyan-300">1:{stock.riskRewardRatio}</div>
                    </div>
                  </div>

                  {/* Footer note: Zone + holding time */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Zone: <strong className="text-slate-200">{stock.pricePosition.zone}</strong> • RVOL {stock.rvol}x</span>
                    <span className="text-cyan-400 flex items-center gap-0.5">Select & Track <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
