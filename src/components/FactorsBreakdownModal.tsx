import React from 'react';
import { X, CheckCircle, XCircle, MinusCircle, Info } from 'lucide-react';
import { SignalResult } from '../types/crypto';
import { playClickSound } from '../services/audio';

interface FactorsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SignalResult | null;
}

export const FactorsBreakdownModal: React.FC<FactorsBreakdownModalProps> = ({
  isOpen,
  onClose,
  signal,
}) => {
  if (!isOpen || !signal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl glow-cyan overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wide text-white">8-Factor Analysis Matrix</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {signal.timeframe} · {signal.displayName}
            </span>
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

        {/* Summary Counter Bar */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {signal.factorsSummary.bullishCount} Bullish
            </span>
            <span className="text-red-400 font-bold flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" />
              {signal.factorsSummary.bearishCount} Bearish
            </span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <MinusCircle className="h-3.5 w-3.5" />
              {signal.factorsSummary.neutralCount} Neutral
            </span>
          </div>
          <span className="text-cyan-400 font-bold">
            {Math.round(signal.factorsSummary.agreementRatio * 100)}% Agreement
          </span>
        </div>

        {/* Factors Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {signal.factors.map((factor, index) => {
            const isBull = factor.vote === 'BULLISH';
            const isBear = factor.vote === 'BEARISH';

            let voteBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
            let cardBorder = 'border-slate-800';

            if (isBull) {
              voteBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
              cardBorder = 'border-emerald-500/30';
            } else if (isBear) {
              voteBadgeColor = 'bg-red-500/20 text-red-400 border-red-500/40';
              cardBorder = 'border-red-500/30';
            }

            return (
              <div
                key={factor.id}
                className={`rounded-xl bg-slate-950/70 border ${cardBorder} p-3.5 flex flex-col gap-2 transition`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">0{index + 1}.</span>
                    <span className="text-xs font-bold text-white tracking-wide">{factor.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${voteBadgeColor}`}>
                    {factor.vote}
                  </span>
                </div>

                {/* Summary narrative */}
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {factor.summary}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
                  {Object.entries(factor.metrics).map(([key, value]) => (
                    <div key={key} className="bg-slate-900/80 rounded-lg px-2 py-1 flex flex-col">
                      <span className="text-[9px] font-mono text-slate-400">{key}</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-200 truncate">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono bg-slate-950">
          <span>Mode: {signal.strictMode ? 'STRICT (Min 6 Factors)' : 'NORMAL (Min 4 Factors)'}</span>
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
