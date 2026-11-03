import React, { useState } from 'react';
import { 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Flame,
  Check,
  Octagon
} from 'lucide-react';
import { ActiveLiveTrade } from '../types/crypto';
import { playClickSound } from '../services/audio';

interface ActiveTradesBoardProps {
  trades: ActiveLiveTrade[];
  onCloseTrade: (tradeId: string) => void;
  onEmergencyStop?: () => void;
  livePrices: Record<string, number>;
}

export const ActiveTradesBoard: React.FC<ActiveTradesBoardProps> = ({
  trades,
  onCloseTrade,
  onEmergencyStop,
  livePrices,
}) => {
  const [showConfirmEmergency, setShowConfirmEmergency] = useState(false);

  if (trades.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-wide text-cyan-300 uppercase">
            Live Monitored Trades ({trades.length})
          </span>
        </div>

        {/* Emergency Stop Trading Button */}
        {onEmergencyStop && (
          <button
            onClick={() => {
              playClickSound();
              if (!showConfirmEmergency) {
                setShowConfirmEmergency(true);
              } else {
                onEmergencyStop();
                setShowConfirmEmergency(false);
              }
            }}
            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              showConfirmEmergency
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/50 hover:bg-rose-900'
            }`}
          >
            <Octagon className="h-3.5 w-3.5 fill-current" />
            <span>{showConfirmEmergency ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP'}</span>
          </button>
        )}
      </div>

      {showConfirmEmergency && (
        <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-mono flex items-center justify-between">
          <span>🚨 Press again to immediately close ALL active trades and halt auto scanner.</span>
          <button
            onClick={() => setShowConfirmEmergency(false)}
            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        {trades.map((trade) => {
          const isLong = trade.direction === 'LONG';
          const now = Date.now();
          const totalMs = trade.targetEndTime - trade.startTime;
          const remainingMs = Math.max(0, trade.targetEndTime - now);
          const elapsedMs = totalMs - remainingMs;
          const progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

          // Format remaining time
          const mins = Math.floor(remainingMs / 60000);
          const secs = Math.floor((remainingMs % 60000) / 1000);
          const timeText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          // Live price & dynamic P/L %
          const currentPrice = livePrices[trade.symbol] || trade.entryPrice;
          const priceDiff = currentPrice - trade.entryPrice;
          const rawPnl = isLong 
            ? (priceDiff / trade.entryPrice) * 100 
            : (-priceDiff / trade.entryPrice) * 100;
          const pnlPercent = parseFloat(rawPnl.toFixed(2));
          const isWinning = pnlPercent > 0;

          const borderStyle = isLong 
            ? 'border-emerald-500/50 glow-green-border' 
            : 'border-red-500/50 glow-red-border';

          return (
            <div
              key={trade.id}
              className={`rounded-2xl bg-slate-900/90 border ${borderStyle} p-3.5 flex flex-col gap-2.5 shadow-xl transition-all`}
            >
              {/* Top Banner: [PAIR] • [LONG/SHORT] • [time left] */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white tracking-wide">
                    {trade.displayName}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}>
                    {isLong ? <ArrowUp className="h-3 w-3 stroke-[3]" /> : <ArrowDown className="h-3 w-3 stroke-[3]" />}
                    {trade.direction}
                  </span>
                  <span className="text-slate-500">•</span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-cyan-300">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{timeText}</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="text-right">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    trade.status === 'PENDING_ENTRY'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      : (isWinning ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-red-950/80 text-red-300 border border-red-800')
                  }`}>
                    {trade.status === 'PENDING_ENTRY' ? 'WAITING ENTRY' : `${pnlPercent >= 0 ? '+' : ''}${pnlPercent}% P/L`}
                  </span>
                </div>
              </div>

              {/* Progress Bar of Time Limit */}
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    remainingMs <= 60000 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Price Grid: Entry, SL, TP1, Current */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono pt-1 border-t border-slate-800/80">
                <div className="bg-slate-950/80 rounded-lg p-1.5">
                  <span className="text-[9px] text-slate-500">Entry</span>
                  <div className="text-white font-bold truncate">
                    ${trade.entryPrice.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-lg p-1.5 border border-red-500/20">
                  <span className="text-[9px] text-red-400">SL</span>
                  <div className="text-red-300 font-bold truncate">
                    ${trade.stopLoss.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-lg p-1.5 border border-emerald-500/20">
                  <span className="text-[9px] text-emerald-400">TP 1</span>
                  <div className="text-emerald-300 font-bold truncate">
                    ${trade.takeProfit1.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-lg p-1.5">
                  <span className="text-[9px] text-cyan-400">Mark Price</span>
                  <div className="text-white font-bold truncate">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action buttons & disclaimer note */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] font-mono text-slate-500">
                  Result based on app price data and may differ from your exchange.
                </span>

                <button
                  onClick={() => {
                    playClickSound();
                    onCloseTrade(trade.id);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 transition cursor-pointer"
                >
                  Close Trade
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
