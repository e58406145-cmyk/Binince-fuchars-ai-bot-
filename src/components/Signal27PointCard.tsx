import React, { useState } from 'react';
import { 
  FullSignal27Point, 
  ExchangeId 
} from '../types/crypto';
import { 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Sliders, 
  CheckCircle, 
  Crosshair, 
  Percent, 
  Compass, 
  BarChart2, 
  Layers, 
  FileText, 
  Send, 
  X,
  Zap,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { calculateLiquidationPrice, LEVERAGE_OPTIONS } from '../services/autoScannerEngine';

interface Signal27PointCardProps {
  signal: FullSignal27Point;
  onClose?: () => void;
  onTakeTrade?: (signal: FullSignal27Point, selectedLeverage: number) => void;
  onShareWhatsApp?: (signal: FullSignal27Point) => void;
}

export const Signal27PointCard: React.FC<Signal27PointCardProps> = ({
  signal,
  onClose,
  onTakeTrade,
  onShareWhatsApp,
}) => {
  const [selectedLeverage, setSelectedLeverage] = useState<number>(signal.recommendedLeverage || 5);

  const isLong = signal.direction === 'LONG' || signal.direction === 'BUY';
  const isShort = signal.direction === 'SHORT' || signal.direction === 'SELL';
  const isWait = signal.direction === 'WAIT' || signal.direction === 'NO_TRADE';

  const themeBorder = isLong ? 'border-emerald-500/50 shadow-emerald-950/40' : isShort ? 'border-rose-500/50 shadow-rose-950/40' : 'border-slate-500/50 shadow-slate-950/40';
  const themeBgGlow = isLong ? 'from-emerald-950/30 to-slate-950' : isShort ? 'from-rose-950/30 to-slate-950' : 'from-slate-900 to-slate-950';
  const themeText = isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400';

  // Dynamic liquidation price with user selected leverage
  const dynamicLiquidation = calculateLiquidationPrice(
    signal.entryPrice,
    (signal.direction === 'NO_TRADE' || signal.direction === 'WAIT') ? 'LONG' : (signal.direction === 'BUY' ? 'LONG' : signal.direction === 'SELL' ? 'SHORT' : signal.direction as any),
    selectedLeverage
  );
  const dynamicLiqBuffer = signal.entryPrice > 0 
    ? (Math.abs(signal.entryPrice - dynamicLiquidation) / signal.entryPrice) * 100 
    : 10;

  return (
    <div className={`relative bg-gradient-to-b ${themeBgGlow} border-2 ${themeBorder} rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-slate-100 max-w-2xl mx-auto my-4 transition-all`}>
      {/* Top Banner: Exchange, Pair, Direction & Setup Score */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider">
              {signal.exchange.toUpperCase()} {signal.marketType || 'FUTURES'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {signal.timeframe} TF
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold">
              {signal.source} SIGNAL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-mono text-white">
              {signal.displayName}
            </h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-black text-xs sm:text-sm shadow-md ${
              isLong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' :
              isShort ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50' :
              'bg-amber-500/20 text-amber-300 border border-amber-400/50'
            }`}>
              {isLong ? <TrendingUp className="h-4 w-4" /> : isShort ? <TrendingDown className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
              <span>{signal.direction}</span>
            </div>
          </div>
        </div>

        {/* Setup Score Gauge */}
        <div className="flex flex-col items-end">
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer mb-2"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Setup Score</div>
            <div className={`text-2xl font-black font-mono leading-none ${themeText}`}>
              {signal.setupScore}<span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
              {signal.confidenceScore}% Confidence
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics Grid (Points 4 - 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">Current Live Price</div>
          <div className="text-sm sm:text-base font-bold font-mono text-cyan-300 mt-0.5">
            ${formatCryptoPrice(signal.currentPrice)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">Suggested Entry</div>
          <div className="text-sm sm:text-base font-bold font-mono text-white mt-0.5">
            ${formatCryptoPrice(signal.entryPrice)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">Safe Entry Zone</div>
          <div className="text-xs font-mono text-slate-300 mt-1">
            ${formatCryptoPrice(signal.entryZoneMin)} - ${formatCryptoPrice(signal.entryZoneMax)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>Holding Period</span>
          </div>
          <div className="text-xs font-bold font-mono text-amber-300 mt-1">
            {signal.holdingPeriod}
          </div>
        </div>
      </div>

      {/* Leverage System & Liquidation Safety (Points 9, 23) */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 sm:p-4 my-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono uppercase tracking-wide text-cyan-300">
              Futures Leverage System (1x - 100x)
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Recommended: <span className="text-emerald-400 font-bold">{signal.recommendedLeverage}x</span>
          </div>
        </div>

        {/* Leverage Tier Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {LEVERAGE_OPTIONS.map((lev) => (
            <button
              key={lev}
              onClick={() => setSelectedLeverage(lev)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                selectedLeverage === lev
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : lev === signal.recommendedLeverage
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>

        {/* Dynamic Liquidation Safety Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Est. Liquidation Price:</span>
            <span className="font-bold text-rose-400">${formatCryptoPrice(dynamicLiquidation)}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Liquidation Safety Buffer:</span>
            <span className={`font-bold ${dynamicLiqBuffer >= 15 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dynamicLiqBuffer.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Target & Stop Loss Breakdown (Points 10 - 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        {/* Stop Loss */}
        <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] text-rose-400 font-mono">
            <span>Stop Loss (SL)</span>
            <span>-{signal.stopLossDistancePercent}%</span>
          </div>
          <div className="text-sm font-bold font-mono text-rose-300 mt-1">
            ${formatCryptoPrice(signal.stopLoss)}
          </div>
        </div>

        {/* Take Profit 1 */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
            <span>TP 1 (50% Close)</span>
            <span>+{signal.takeProfit1DistancePercent}%</span>
          </div>
          <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
            ${formatCryptoPrice(signal.takeProfit1)}
          </div>
        </div>

        {/* Take Profit 2 */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
            <span>TP 2 (Target)</span>
            <span>+{signal.takeProfit2DistancePercent}%</span>
          </div>
          <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
            ${formatCryptoPrice(signal.takeProfit2)}
          </div>
        </div>

        {/* Take Profit 3 */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
            <span>TP 3 (Runner)</span>
            <span>+{signal.takeProfit3DistancePercent}%</span>
          </div>
          <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
            ${formatCryptoPrice(signal.takeProfit3)}
          </div>
        </div>
      </div>

      {/* Technical Indicators & Structure (Points 17 - 24) */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 my-4 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            <span>Market Trend:</span>
          </span>
          <span className="font-bold text-white uppercase">{signal.marketTrend.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">RSI Analysis (14):</span>
          <span className="text-cyan-300 font-bold">{signal.rsiValue} ({signal.rsiCondition})</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">EMA Confirmation (9/21/50/200):</span>
          <span className="text-slate-200 text-[11px] truncate max-w-[220px] sm:max-w-xs">{signal.emaTrendDescription}</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">MACD Confirmation:</span>
          <span className="text-slate-200">{signal.macdStatusDescription}</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Volume Analysis:</span>
          <span className="text-slate-200">{signal.volumeTrendDescription}</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Support & Resistance:</span>
          <span className="text-slate-200">
            Support: ${formatCryptoPrice(signal.supportLevel)} | Resistance: ${formatCryptoPrice(signal.resistanceLevel)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Funding Rate & Sentiment:</span>
          <span className="text-cyan-300">{signal.fundingRatePercentText} ({signal.sentimentText})</span>
        </div>
      </div>

      {/* Detailed AI Market Analysis Narrative (Point 27) */}
      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 my-4">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-300 mb-2">
          <FileText className="h-4 w-4" />
          <span>Detailed AI Market Analysis:</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {signal.aiMarketAnalysisNarrative}
        </p>

        {signal.reasons && signal.reasons.length > 0 && (
          <div className="mt-3 pt-3 border-t border-cyan-900/40">
            <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">Key Confluence Factors:</div>
            <div className="flex flex-wrap gap-1.5">
              {signal.reasons.map((r, idx) => (
                <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/20 text-slate-300">
                  ✓ {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timestamps (Points 25, 26) */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
        <div>Signal Generation Time: <strong className="text-slate-300">{signal.generationTimeFormatted}</strong></div>
        <div>Signal Review Time: <strong className="text-cyan-300">{signal.expiryTimeFormatted}</strong></div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4 pt-2">
        {onTakeTrade && signal.direction !== 'NO_TRADE' && (
          <button
            onClick={() => onTakeTrade(signal, selectedLeverage)}
            className={`flex-1 py-2.5 px-4 rounded-xl font-mono font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
              isLong 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>I Took This Trade ({selectedLeverage}x)</span>
          </button>
        )}

        {onShareWhatsApp && (
          <button
            onClick={() => onShareWhatsApp(signal)}
            className="py-2.5 px-4 rounded-xl font-mono font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition cursor-pointer flex items-center gap-1.5"
            title="Share signal to configured WhatsApp recipients"
          >
            <Send className="h-4 w-4" />
            <span>WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  );
};
