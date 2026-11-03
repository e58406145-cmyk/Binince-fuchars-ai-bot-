import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Copy, 
  Check, 
  ListFilter, 
  Target, 
  ShieldAlert, 
  AlertTriangle,
  Scale,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';
import { SignalResult } from '../types/crypto';
import { playClickSound } from '../services/audio';
import { formatCryptoPrice } from '../utils/formatters';

interface SignalCardProps {
  signal: SignalResult;
  onOpenBreakdown: () => void;
  validForLabel?: string;
  onTakeTrade?: () => void;
  isTradeActive?: boolean;
  measuredWinRateText?: string;
}

export const SignalCard: React.FC<SignalCardProps> = ({ 
  signal, 
  onOpenBreakdown,
  validForLabel = '15 minutes',
  onTakeTrade,
  isTradeActive,
  measuredWinRateText = 'Not enough data yet (0 trades)',
}) => {
  const [copied, setCopied] = useState(false);

  const isLong = signal.signal === 'LONG';
  const isShort = signal.signal === 'SHORT';
  const isNoTrade = signal.signal === 'NO_TRADE';

  // Card theme styling
  let containerClasses = 'bg-slate-900/90 border-amber-500/80 glow-amber-border';
  let badgeClasses = 'bg-amber-500/20 text-amber-400 border border-amber-500/50';

  if (isLong) {
    containerClasses = 'bg-slate-900/90 border-emerald-500/90 glow-green-border';
    badgeClasses = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/60';
  } else if (isShort) {
    containerClasses = 'bg-slate-900/90 border-red-500/90 glow-red-border';
    badgeClasses = 'bg-red-500/20 text-red-400 border border-red-500/60';
  }

  // Compute entry zone
  const atr = signal.klineSnapshot?.atr14 || signal.entryPrice * 0.01;
  const buffer = atr * 0.25;
  const entryMin = isLong ? signal.entryPrice - buffer : signal.entryPrice;
  const entryMax = isLong ? signal.entryPrice : signal.entryPrice + buffer;

  // Factors for and against
  const agreeingVote = isLong ? 'BULLISH' : 'BEARISH';
  const opposingVote = isLong ? 'BEARISH' : 'BULLISH';
  const factorsFor = signal.factors.filter((f) => f.vote === agreeingVote).map((f) => f.category);
  const factorsAgainst = signal.factors.filter((f) => f.vote === opposingVote).map((f) => f.category);

  // Agreement Score calculation (not a probability)
  const agreementRatio = signal.factorsSummary.agreementRatio || (signal.confidenceScore / 100);
  const agreementScore = Math.round(agreementRatio * 100);

  const handleCopy = () => {
    playClickSound();
    const text = `🎯 CYBERPULSE FUTURES SIGNAL
Pair: ${signal.displayName} (${signal.exchange.toUpperCase()})
Timeframe: ${signal.timeframe}
Signal: ${signal.signal}
Entry Zone: $${formatCryptoPrice(entryMin)} - $${formatCryptoPrice(entryMax)}
Stop Loss (ATR): $${formatCryptoPrice(signal.stopLoss)}
Target 1: $${formatCryptoPrice(signal.targetPrice1)}
Target 2: $${formatCryptoPrice(signal.targetPrice2)}
Risk/Reward: 1:${signal.riskRewardRatio}
Valid for: ${validForLabel}
Agreement Score: ${agreementScore}/100 (agreement between factor groups, not a probability)
Measured Win Rate: ${measuredWinRateText}
Analysis only, not financial advice. Trading carries risk of loss.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className={`relative w-full rounded-2xl p-4 transition-all duration-500 flex flex-col gap-3.5 ${containerClasses}`}>
      
      {/* Top Card Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Direction Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm tracking-wider uppercase ${badgeClasses}`}>
            {isLong && <ArrowUp className="h-5 w-5 stroke-[3] animate-bounce" />}
            {isShort && <ArrowDown className="h-5 w-5 stroke-[3] animate-bounce" />}
            {isNoTrade && <Minus className="h-5 w-5 stroke-[3]" />}
            <span>{signal.signal.replace('_', ' ')}</span>
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-white tracking-wide">
              {signal.displayName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {signal.strategyName} · {signal.timeframe}
            </span>
          </div>
        </div>

        {/* Valid For & Score Badge */}
        <div className="text-right flex flex-col items-end">
          <div className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 mb-0.5">
            Valid for: {validForLabel}
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase">
            {signal.factorsSummary.bullishCount} BULL · {signal.factorsSummary.bearishCount} BEAR
          </span>
        </div>
      </div>

      {/* Agreement Score Banner (not a probability) */}
      <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-2.5 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
            <span>Agreement Score: {agreementScore}/100</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">
            Agreement between factor groups, not a probability
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Strategy</span>
          <span className="text-xs font-mono font-semibold text-slate-200">{signal.timeframe} Setup</span>
        </div>
      </div>

      {/* Main Signal Display */}
      {isNoTrade ? (
        /* NO TRADE Alert Banner & Requirements */
        <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>NO TRADE: Conditions Not Strong Enough</span>
          </div>
          <div className="text-slate-300 space-y-1 text-[11px] font-mono">
            {signal.reasons.length > 0 ? (
              signal.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-amber-400">✕</span>
                  <span>{r}</span>
                </div>
              ))
            ) : (
              <p>Market is in indecisive equilibrium. Wait for directional momentum breakout.</p>
            )}
          </div>
        </div>
      ) : (
        /* Trade Plan Price Grid: Entry Zone, SL, TP1, TP2, R:R, Est Holding */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Entry Zone */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-400">Entry Zone</span>
            <div className="font-mono text-xs font-bold text-white mt-0.5">
              ${formatCryptoPrice(entryMin)} - ${formatCryptoPrice(entryMax)}
            </div>
          </div>

          {/* Stop Loss (ATR) */}
          <div className="rounded-xl bg-slate-950/80 border border-red-500/30 p-2.5">
            <span className="text-[10px] font-mono uppercase text-red-400 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Stop Loss (ATR)
            </span>
            <div className="font-mono text-xs font-bold text-red-300 mt-0.5">
              ${formatCryptoPrice(signal.stopLoss)}
            </div>
          </div>

          {/* Risk / Reward */}
          <div className="rounded-xl bg-slate-950/80 border border-cyan-500/30 p-2.5">
            <span className="text-[10px] font-mono uppercase text-cyan-400 flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Risk / Reward
            </span>
            <div className="font-mono text-xs font-bold text-cyan-300 mt-0.5">
              1 : {signal.riskRewardRatio}
            </div>
          </div>

          {/* Target 1 */}
          <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 p-2.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              TP 1 (1:1.5)
            </span>
            <div className="font-mono text-xs font-bold text-emerald-300 mt-0.5">
              ${formatCryptoPrice(signal.targetPrice1)}
            </div>
          </div>

          {/* Target 2 */}
          <div className="rounded-xl bg-slate-950/80 border border-emerald-500/40 p-2.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              TP 2 (1:2.0)
            </span>
            <div className="font-mono text-xs font-bold text-emerald-200 mt-0.5">
              ${formatCryptoPrice(signal.targetPrice2)}
            </div>
          </div>

          {/* Estimated Holding Time */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" />
              Holding Time
            </span>
            <div className="font-mono text-xs font-bold text-slate-200 mt-0.5">
              {validForLabel}
            </div>
          </div>
        </div>
      )}

      {/* Factors For and Against */}
      {!isNoTrade && (
        <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 space-y-1.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-[11px]">Factors For:</span>
            <div className="flex flex-wrap gap-1">
              {factorsFor.length > 0 ? (
                factorsFor.map((cat, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px]">
                    ✓ {cat}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[10px]">None</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold text-[11px]">Factors Against:</span>
            <div className="flex flex-wrap gap-1">
              {factorsAgainst.length > 0 ? (
                factorsAgainst.map((cat, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-300 text-[10px]">
                    ✕ {cat}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[10px]">None (Zero opposing factors)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Measured Win Rate (computed only from app's logged paper trades) */}
      <div className="rounded-xl bg-cyan-950/20 border border-cyan-800/40 p-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">Measured Win Rate:</span>
        </div>
        <span className="font-bold text-cyan-300 text-[11px]">
          {measuredWinRateText}
        </span>
      </div>

      {/* Primary CTA: "I took this trade" */}
      {!isNoTrade && onTakeTrade && (
        <button
          onClick={() => {
            playClickSound();
            onTakeTrade();
          }}
          disabled={isTradeActive}
          className={`w-full py-3 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
            isTradeActive
              ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300 cursor-not-allowed'
              : (isLong
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 glow-green'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-slate-950 hover:from-red-400 hover:to-rose-500 glow-red')
          }`}
        >
          {isTradeActive ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Trade Active & Monitored with Timers</span>
            </>
          ) : (
            <>
              <span>⚡ I took this trade (Start Live Timer)</span>
            </>
          )}
        </button>
      )}

      {/* Strategy Description note */}
      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
        {signal.strategyDescription}
      </p>

      {/* Action Buttons: View Breakdown & Copy Trade */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => {
            playClickSound();
            onOpenBreakdown();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 text-xs font-semibold hover:bg-cyan-950/40 transition cursor-pointer"
        >
          <ListFilter className="h-4 w-4" />
          <span>View 8 Factors ({signal.factorsSummary.bullishCount} Bull / {signal.factorsSummary.bearishCount} Bear)</span>
        </button>

        {!isNoTrade && (
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold hover:border-slate-500 transition cursor-pointer"
            title="Copy Signal to Clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
