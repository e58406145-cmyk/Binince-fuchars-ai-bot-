import React from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Target, 
  ShieldAlert, 
  Scale, 
  Share2, 
  AlertCircle,
  BellRing,
  Sparkles,
  Check
} from 'lucide-react';
import { ScannedPairResult, CryptoPair } from '../types/crypto';
import { playClickSound } from '../services/audio';
import { formatCryptoPrice } from '../utils/formatters';

interface ScannerResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topPairs: ScannedPairResult[];
  onSelectPair: (item: ScannedPairResult) => void;
  selectedPair: CryptoPair | null;
  scannedTotalCount: number;
  timeframe: string;
}

export const ScannerResultsModal: React.FC<ScannerResultsModalProps> = ({
  isOpen,
  onClose,
  topPairs,
  onSelectPair,
  selectedPair,
  scannedTotalCount,
  timeframe,
}) => {
  if (!isOpen) return null;

  const hasResults = topPairs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-xl max-h-[92vh] rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-2xl glow-cyan overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Market Scanner: Top 5 Ranked Signals
              </h3>
              <p className="text-[10px] text-cyan-400 font-mono">
                Scanned across {scannedTotalCount} pairs · {timeframe} Timeframe
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {!hasResults ? (
            /* NO TRADE STATE */
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-amber-950/20 border border-amber-500/40 gap-3">
              <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 glow-amber">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="text-lg font-black tracking-wide text-amber-400">
                NO TRADE: No pair meets the criteria right now
              </div>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                The scanner inspected all liquid perpetuals. Under Strict Mode rules, zero pairs demonstrated adequate multi-factor agreement and higher-timeframe alignment.
              </p>
              <div className="text-[11px] font-mono text-cyan-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                Never forcing a pick · Capital preservation first
              </div>
            </div>
          ) : (
            topPairs.slice(0, 5).map((item, index) => {
              const isLong = item.direction === 'LONG';
              const isSelected = selectedPair?.symbol === item.pair.symbol;

              const cardBorder = isLong 
                ? 'border-emerald-500/60 hover:border-emerald-400 glow-green-border' 
                : 'border-red-500/60 hover:border-red-400 glow-red-border';

              const badgeColor = isLong 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60' 
                : 'bg-red-500/20 text-red-400 border-red-500/60';

              return (
                <div
                  key={item.pair.symbol}
                  onClick={() => {
                    playClickSound();
                    onSelectPair(item);
                  }}
                  className={`p-3.5 rounded-2xl bg-slate-950/80 border ${cardBorder} flex flex-col gap-2.5 transition-all cursor-pointer hover:bg-slate-950/95`}
                >
                  {/* Top row: Rank + Pair + Direction + Agreement Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/50 text-[11px] font-mono font-bold text-cyan-300">
                        #{index + 1}
                      </span>
                      <span className="font-extrabold text-sm text-white tracking-wide">
                        {item.pair.displayName}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.pair.exchange}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${badgeColor}`}>
                        {isLong ? <ArrowUp className="h-3.5 w-3.5 stroke-[3]" /> : <ArrowDown className="h-3.5 w-3.5 stroke-[3]" />}
                        <span>{item.direction}</span>
                      </span>

                      <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80">
                        {item.agreementScoreText}
                      </span>
                    </div>
                  </div>

                  {/* Trade Plan Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono pt-1 border-t border-slate-800/80">
                    <div className="bg-slate-900/80 rounded-lg p-2">
                      <span className="text-[9px] text-slate-400 uppercase">Entry Zone</span>
                      <div className="text-white font-bold truncate">
                        ${formatCryptoPrice(item.entryZoneMin, item.pair.pricePrecision)} - ${formatCryptoPrice(item.entryZoneMax, item.pair.pricePrecision)}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 rounded-lg p-2 border border-red-500/20">
                      <span className="text-[9px] text-red-400 uppercase">Stop Loss</span>
                      <div className="text-red-300 font-bold truncate">
                        ${formatCryptoPrice(item.stopLoss, item.pair.pricePrecision)}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 rounded-lg p-2 border border-emerald-500/20">
                      <span className="text-[9px] text-emerald-400 uppercase">TP 1 / TP 2</span>
                      <div className="text-emerald-300 font-bold truncate">
                        ${formatCryptoPrice(item.takeProfit1, item.pair.pricePrecision)} / ${formatCryptoPrice(item.takeProfit2, item.pair.pricePrecision)}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 rounded-lg p-2">
                      <span className="text-[9px] text-cyan-400 uppercase">Risk / Reward</span>
                      <div className="text-cyan-300 font-bold">
                        1 : {item.riskRewardRatio}
                      </div>
                    </div>
                  </div>

                  {/* Estimated Holding & Factor Summary */}
                  <div className="flex flex-col gap-1 text-[10px] font-mono pt-0.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="h-3 w-3 text-cyan-400 shrink-0" />
                      <span>Est. Holding: <strong className="text-slate-200">{item.estimatedHoldingTime}</strong></span>
                      <span className="text-slate-600">·</span>
                      <span>24h Vol: ${(item.volume24h / 1_000_000).toFixed(1)}M</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-emerald-400 font-semibold">Supporting:</span>
                      {item.factorsFor.slice(0, 4).map((f) => (
                        <span key={f} className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          {f}
                        </span>
                      ))}

                      {item.factorsAgainst.length > 0 && (
                        <>
                          <span className="text-red-400 font-semibold ml-1">Against:</span>
                          {item.factorsAgainst.slice(0, 2).map((f) => (
                            <span key={f} className="px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                              {f}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tap Action Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] font-mono">
                    <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
                      <BellRing className="h-3.5 w-3.5 animate-pulse" />
                      Tap to select & track alerts
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <Share2 className="h-3 w-3" />
                        WhatsApp Ready
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Check className="h-3.5 w-3.5" />
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono bg-slate-950">
          <span>Ranking: Highest Factor Agreement Score</span>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
