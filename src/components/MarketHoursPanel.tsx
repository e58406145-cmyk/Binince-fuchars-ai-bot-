import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  HelpCircle,
  ExternalLink 
} from 'lucide-react';
import { StockMarketId } from '../types/stocks';
import { STOCK_MARKETS, computeMarketStatus, MarketTimeStatus } from '../config/marketHours';

interface MarketHoursPanelProps {
  marketId: StockMarketId;
  observationMinutes?: number;
  customTradingStart?: string;
  customTradingEnd?: string;
  customWindowEnabled?: boolean;
}

export const MarketHoursPanel: React.FC<MarketHoursPanelProps> = ({
  marketId,
  observationMinutes = 15,
  customTradingStart,
  customTradingEnd,
  customWindowEnabled
}) => {
  const [status, setStatus] = useState<MarketTimeStatus>(() => 
    computeMarketStatus(marketId, { observationMinutes, customTradingStart, customTradingEnd, customWindowEnabled })
  );

  useEffect(() => {
    // Update every second for live clock & countdown
    const update = () => {
      setStatus(computeMarketStatus(marketId, { observationMinutes, customTradingStart, customTradingEnd, customWindowEnabled }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [marketId, observationMinutes, customTradingStart, customTradingEnd, customWindowEnabled]);

  const market = STOCK_MARKETS[marketId];

  // Status badge colors
  const getBadgeStyle = () => {
    switch (status.status) {
      case 'OPEN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 glow-emerald';
      case 'OBSERVING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse';
      case 'PRE-MARKET':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      case 'AFTER-HOURS':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'CLOSED':
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Permanent Delayed Data Notice */}
      <div className="w-full bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 text-amber-300 text-[11px] font-mono shadow-sm">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
        <span className="leading-tight">
          Prices are delayed, not real-time. Intraday signals on delayed data are unreliable.
        </span>
      </div>

      {/* Main Market Status Bar */}
      <div className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2 shadow-lg backdrop-blur-md">
        {/* Header row: Exchange Name, Flag & Session Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl" title={market.country}>{market.flag}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  {market.name}
                </span>
                {market.requiresVerification && (
                  <span 
                    title="Official schedule may vary on local holidays; please verify with local exchange"
                    className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900/50 text-amber-300 border border-amber-600/50 cursor-help"
                  >
                    <HelpCircle className="w-2.5 h-2.5" /> verify
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Regular: {market.regularOpen} - {market.regularClose}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border ${getBadgeStyle()}`}>
            {status.statusLabel}
          </div>
        </div>

        {/* Clocks & Countdown Row */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-[11px] font-mono">
          {/* Phone Local Time */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Phone Time:
            </span>
            <span className="text-cyan-200 font-bold tracking-wider">
              {status.phoneLocalTimeStr}
            </span>
          </div>

          {/* Exchange Local Time */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">
              Exchange Local:
            </span>
            <span className="text-slate-200 font-semibold truncate">
              {status.exchangeLocalTimeStr}
            </span>
          </div>
        </div>

        {/* Live Countdown & Next Session */}
        <div className="flex items-center justify-between text-[11px] font-mono px-1">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            {status.countdownText}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[45%] text-right">
            {status.nextSessionText}
          </span>
        </div>

        {/* Warning: Opening Volatility Observation Period */}
        {status.isObservationPeriod && (
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-2 flex items-start gap-2 text-[11px] text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Opening Volatility Observation (First 15m)</div>
              <div className="text-[10px] text-amber-200/90 leading-tight">
                Observing opening volatility — wait for the opening range to settle. High-confidence signals are withheld unless an Opening Range Breakout (ORB) setup is confirmed.
              </div>
            </div>
          </div>
        )}

        {/* Warning: End-of-Day Auto-Square-off Alert */}
        {status.isSquareOffZone && (
          <div className="bg-rose-900/30 border border-rose-500/50 rounded-xl p-2 flex items-start gap-2 text-[11px] text-rose-200 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300">Square-Off Warning ({status.minutesToSquareOff}m to close)</div>
              <div className="text-[10px] text-rose-200/90 leading-tight">
                Market closes in {status.minutesToSquareOff} min. Close open intraday positions to avoid broker auto-square-off charges and overnight gap risk.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
