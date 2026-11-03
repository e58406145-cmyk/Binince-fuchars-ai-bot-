import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Share2, 
  CheckCircle2, 
  HelpCircle,
  Play,
  Calculator,
  Compass
} from 'lucide-react';
import { StockSignalResult } from '../types/stocks';
import { PriceZoneGauge } from './PriceZoneGauge';

interface StockSignalCardProps {
  result: StockSignalResult;
  onOpenCalculator: () => void;
  onTakeTrade: () => void;
  onShareWhatsApp: () => void;
  isTakingTrade?: boolean;
}

export const StockSignalCard: React.FC<StockSignalCardProps> = ({
  result,
  onOpenCalculator,
  onTakeTrade,
  onShareWhatsApp,
  isTakingTrade
}) => {
  const [showFactors, setShowFactors] = useState(false);

  const isBuy = result.signal === 'BUY';
  const isSell = result.signal === 'SELL';
  const isWait = result.signal === 'WAIT';

  const cardBorderClass = isBuy 
    ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]' 
    : isSell 
    ? 'border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)]' 
    : 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]';

  const badgeBgClass = isBuy
    ? 'bg-emerald-500 text-slate-950 glow-emerald'
    : isSell
    ? 'bg-rose-500 text-white glow-rose'
    : 'bg-amber-400 text-slate-950 glow-amber';

  return (
    <div className={`w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border flex flex-col gap-3.5 transition-all duration-300 ${cardBorderClass}`}>
      {/* Top Header: Company Info + Signal Badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white font-mono tracking-wider">
              {result.ticker}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
              {result.market}
            </span>
            {result.passedStrictMode ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600">
                <ShieldCheck className="w-3 h-3" /> STRICT PASSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600">
                <ShieldAlert className="w-3 h-3" /> STRICT FAILED
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 font-medium mt-0.5">
            {result.companyName}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {result.sector}
          </div>
        </div>

        {/* Big Glow Signal Badge */}
        <div className={`px-4 py-2 rounded-2xl flex flex-col items-center justify-center font-extrabold font-mono tracking-wider shadow-lg ${badgeBgClass}`}>
          <div className="flex items-center gap-1 text-base">
            {isBuy && <TrendingUp className="w-5 h-5 stroke-[2.5]" />}
            {isSell && <TrendingDown className="w-5 h-5 stroke-[2.5]" />}
            {isWait && <Clock className="w-5 h-5 stroke-[2.5]" />}
            <span>{result.signal}</span>
          </div>
          <div className="text-[9px] font-bold opacity-90 uppercase">
            {isWait ? 'NO SETUP' : 'RECOMMENDATION'}
          </div>
        </div>
      </div>

      {/* Agreement Score Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Agreement Score
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Based on {result.factorsSummary.totalFactors} technical factors (not a probability)
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl font-extrabold font-mono text-cyan-300">
            {result.agreementScore}
          </span>
          <span className="text-xs font-mono text-slate-500">/100</span>
        </div>
      </div>

      {/* Earnings Warning Banner if present */}
      {result.earningsWarning && (
        <div className="bg-rose-950/60 border border-rose-500/70 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-rose-300">Binary Risk Warning: Earnings Soon</div>
            <div className="text-[11px] text-rose-200/90 leading-tight">
              {result.earningsWarning.warningText}
            </div>
          </div>
        </div>
      )}

      {/* Price Position Guidance Gauge */}
      <PriceZoneGauge guidance={result.pricePosition} currencySymbol={result.currencySymbol} />

      {/* Trade Plan Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Entry Zone */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Entry Zone</span>
          <span className="text-sm font-bold text-white">
            {result.currencySymbol}{result.entryZone.min} - {result.currencySymbol}{result.entryZone.max}
          </span>
          <span className="text-[10px] text-cyan-400/90 mt-0.5 truncate">
            Current: {result.currencySymbol}{result.entryPrice}
          </span>
        </div>

        {/* Stop Loss with Reason */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Stop-Loss ({result.stopLossPercent}%)</span>
          <span className="text-sm font-bold text-rose-400">
            {result.currencySymbol}{result.stopLoss}
          </span>
          <span className="text-[9px] text-slate-400 truncate mt-0.5" title={result.stopLossReason}>
            {result.stopLossReason}
          </span>
        </div>

        {/* Take Profit 1 */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Take Profit 1 (1:1.5)</span>
          <span className="text-sm font-bold text-emerald-400">
            {result.currencySymbol}{result.targetPrice1}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Partial profit target</span>
        </div>

        {/* Take Profit 2 & R:R */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Take Profit 2 (1:2.5)</span>
          <span className="text-sm font-bold text-emerald-300">
            {result.currencySymbol}{result.targetPrice2}
          </span>
          <span className="text-[10px] text-cyan-300 font-bold mt-0.5">
            R:R = 1:{result.riskRewardRatio}
          </span>
        </div>
      </div>

      {/* Suggested Timing & Estimated Holding Time */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-1.5 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold">{result.suggestedBuyTime}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Holding: {result.estimatedHoldingTime}</span>
        </div>
      </div>

      {/* Expandable Factors Breakdown */}
      <div className="border-t border-slate-800 pt-2 flex flex-col gap-2">
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="w-full flex items-center justify-between text-xs font-mono text-cyan-400 hover:text-cyan-300 p-1"
        >
          <span className="font-semibold flex items-center gap-1.5">
            Technical Factors ({result.factorsSummary.bullishCount} Bullish, {result.factorsSummary.bearishCount} Bearish)
          </span>
          {showFactors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFactors && (
          <div className="space-y-2 pt-1 text-xs">
            {result.factors.map(f => (
              <div 
                key={f.id} 
                className={`p-2 rounded-xl border flex flex-col gap-1 ${
                  f.vote === 'BULLISH' 
                    ? 'bg-emerald-950/30 border-emerald-600/40' 
                    : f.vote === 'BEARISH' 
                    ? 'bg-rose-950/30 border-rose-600/40' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{f.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    f.vote === 'BULLISH' ? 'bg-emerald-500 text-slate-950' : f.vote === 'BEARISH' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {f.vote}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">{f.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons: Take Trade, Calculator, WhatsApp */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={onTakeTrade}
          className="col-span-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-2.5 px-3 rounded-2xl text-xs font-mono flex items-center justify-center gap-1.5 shadow-md glow-emerald transition cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>I Took Trade</span>
        </button>

        <button
          onClick={onOpenCalculator}
          className="col-span-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-semibold py-2.5 px-3 rounded-2xl text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Position Size</span>
        </button>

        <button
          onClick={onShareWhatsApp}
          className="col-span-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 font-semibold py-2.5 px-3 rounded-2xl text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
