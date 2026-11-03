import React from 'react';
import { BellRing, ShieldAlert, Target, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { TrackedTradeAlert } from '../types/crypto';
import { playClickSound } from '../services/audio';

interface TrackedPairAlertBarProps {
  alert: TrackedTradeAlert | null;
  onClearTrack: () => void;
  currentPrice?: number;
}

export const TrackedPairAlertBar: React.FC<TrackedPairAlertBarProps> = ({
  alert,
  onClearTrack,
  currentPrice,
}) => {
  if (!alert) return null;

  const isLong = alert.direction === 'LONG';

  return (
    <div className="w-full rounded-xl bg-slate-900/90 border border-cyan-500/50 p-3 flex flex-col gap-2 shadow-lg glow-cyan text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <BellRing className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            Tracking {alert.pairSymbol} ({alert.direction})
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            PRICE ALERTS ARMED
          </span>
        </div>

        <button
          onClick={() => {
            playClickSound();
            onClearTrack();
          }}
          className="text-slate-400 hover:text-white p-1"
          title="Stop tracking this pair"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Alert levels badge row */}
      <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
        <div className={`p-1.5 rounded-lg border flex flex-col ${
          alert.entryTriggered ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span className="text-[9px]">Entry</span>
          <span className="font-bold text-white truncate">${alert.entryMin.toFixed(2)}</span>
          {alert.entryTriggered && <span className="text-[8px] text-cyan-300">TRIGGERED</span>}
        </div>

        <div className={`p-1.5 rounded-lg border flex flex-col ${
          alert.slTriggered ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span className="text-[9px] text-red-400">Stop Loss</span>
          <span className="font-bold text-red-300 truncate">${alert.stopLoss.toFixed(2)}</span>
          {alert.slTriggered && <span className="text-[8px] text-red-400">HIT</span>}
        </div>

        <div className={`p-1.5 rounded-lg border flex flex-col ${
          alert.tp1Triggered ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span className="text-[9px] text-emerald-400">TP 1</span>
          <span className="font-bold text-emerald-300 truncate">${alert.takeProfit1.toFixed(2)}</span>
          {alert.tp1Triggered && <span className="text-[8px] text-emerald-400">HIT</span>}
        </div>

        <div className={`p-1.5 rounded-lg border flex flex-col ${
          alert.tp2Triggered ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span className="text-[9px] text-emerald-400">TP 2</span>
          <span className="font-bold text-emerald-300 truncate">${alert.takeProfit2.toFixed(2)}</span>
          {alert.tp2Triggered && <span className="text-[8px] text-emerald-400">HIT</span>}
        </div>
      </div>
    </div>
  );
};
