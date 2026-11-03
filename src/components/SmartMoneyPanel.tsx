import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertCircle, 
  PieChart, 
  Zap, 
  BarChart3, 
  Layers, 
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { MarketOptionId, Timeframe, CryptoPair, SmartMoneyData } from '../types/crypto';
import { calculateSmartMoneyData } from '../services/smartMoneyEngine';
import { playClickSound } from '../services/audio';

interface SmartMoneyPanelProps {
  marketOptionId: MarketOptionId;
  selectedPair: CryptoPair | null;
  timeframe: Timeframe;
  coinGlassApiKey?: string;
}

export const SmartMoneyPanel: React.FC<SmartMoneyPanelProps> = ({
  marketOptionId,
  selectedPair,
  timeframe,
  coinGlassApiKey,
}) => {
  const [data, setData] = useState<SmartMoneyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);

  const fetchSmartMoney = useCallback(async () => {
    if (!selectedPair) return;
    setIsLoading(true);
    setErrorState(false);

    try {
      const res = await calculateSmartMoneyData(
        marketOptionId,
        selectedPair.symbol,
        timeframe,
        selectedPair.displayName,
        coinGlassApiKey
      );
      setData(res);
    } catch {
      setErrorState(true);
    } finally {
      setIsLoading(false);
    }
  }, [marketOptionId, selectedPair, timeframe, coinGlassApiKey]);

  useEffect(() => {
    fetchSmartMoney();
    const interval = setInterval(fetchSmartMoney, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [fetchSmartMoney]);

  if (!selectedPair) return null;

  const isSpot = marketOptionId.endsWith('SPOT');

  return (
    <div className="w-full rounded-2xl bg-slate-900/95 border border-cyan-500/30 p-4 shadow-2xl font-mono text-slate-100 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                SMART MONEY & WHALE TRACKER
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-black uppercase">
                {selectedPair.displayName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Real-time Volume Pressure, Order Depth Imbalance & CVD Flow
            </p>
          </div>
        </div>

        {/* Live Refresh Button */}
        <button
          onClick={() => {
            playClickSound();
            fetchSmartMoney();
          }}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH DATA</span>
        </button>
      </div>

      {/* Main Display Body */}
      {errorState ? (
        /* DATA UNAVAILABLE STATE */
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-black">DATA UNAVAILABLE</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Market data endpoints for {selectedPair.displayName} are temporarily unreachable or rate limited. Percentage figures are never fabricated or guessed.
          </p>
          <button
            onClick={() => {
              playClickSound();
              fetchSmartMoney();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 transition cursor-pointer"
          >
            Retry Endpoint Connection
          </button>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Buyer vs Seller Pressure Percentage Gauge */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <TrendingUp className="h-4 w-4 stroke-[3]" />
                <span>BUYER PRESSURE: {data.buyerPressurePercent}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span>SELLER PRESSURE: {data.sellerPressurePercent}%</span>
                <TrendingDown className="h-4 w-4 stroke-[3]" />
              </div>
            </div>

            {/* Visual Split Bar */}
            <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${data.buyerPressurePercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 h-full transition-all duration-500"
                style={{ width: `${data.sellerPressurePercent}%` }}
              />
            </div>

            {/* Smart Money Direction Badge */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-sans">Smart Money Bias:</span>
              <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${
                data.smartMoneyDirection === 'ACCUMULATION' || data.smartMoneyDirection === 'BULLISH'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 glow-green'
                  : data.smartMoneyDirection === 'DISTRIBUTION' || data.smartMoneyDirection === 'BEARISH'
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50 glow-red'
                  : 'bg-slate-800 text-slate-300 border-slate-600'
              }`}>
                {data.smartMoneyDirection === 'ACCUMULATION' ? '⚡ INSTITUTIONAL ACCUMULATION' :
                 data.smartMoneyDirection === 'BULLISH' ? '🟢 STRONG BUYER BIAS' :
                 data.smartMoneyDirection === 'DISTRIBUTION' ? '🚨 INSTITUTIONAL DISTRIBUTION' :
                 data.smartMoneyDirection === 'BEARISH' ? '🔴 STRONG SELLER BIAS' :
                 '⚖️ NEUTRAL / BALANCED ORDER FLOW'}
              </span>
            </div>
          </div>

          {/* Key Smart Money Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {/* CVD Delta */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <BarChart3 className="h-3 w-3 text-cyan-400" />
                <span>24h CVD (Flow)</span>
              </div>
              <div className={`font-bold text-sm ${data.cvd24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.cvd24h >= 0 ? '+' : ''}${(data.cvd24h / 1e6).toFixed(2)}M
              </div>
            </div>

            {/* Order Book Depth Imbalance */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Layers className="h-3 w-3 text-cyan-400" />
                <span>Book Imbalance</span>
              </div>
              <div className={`font-bold text-sm ${data.orderBookImbalancePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.orderBookImbalancePercent >= 0 ? '+' : ''}{data.orderBookImbalancePercent}% Bids
              </div>
            </div>

            {/* Global Long/Short Ratio (Futures only) */}
            {!isSpot ? (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <PieChart className="h-3 w-3 text-amber-400" />
                  <span>Global L/S Ratio</span>
                </div>
                <div className="font-bold text-sm text-amber-300">
                  {data.globalLongShortRatio || '1.00'}x
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  <span>Taker Buy Vol</span>
                </div>
                <div className="font-bold text-sm text-emerald-400">
                  ${(data.takerBuyVolume24h / 1e6).toFixed(1)}M
                </div>
              </div>
            )}

            {/* Funding Rate (Futures only) */}
            {!isSpot ? (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Zap className="h-3 w-3 text-purple-400" />
                  <span>Funding Rate</span>
                </div>
                <div className={`font-bold text-sm ${(data.fundingRate || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((data.fundingRate || 0) * 100).toFixed(4)}%
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <TrendingDown className="h-3 w-3 text-rose-400" />
                  <span>Taker Sell Vol</span>
                </div>
                <div className="font-bold text-sm text-rose-400">
                  ${(data.takerSellVolume24h / 1e6).toFixed(1)}M
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata & Compliance Note */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-mono gap-1">
            <span>Source: <strong className="text-cyan-300">{data.dataSource}</strong></span>
            <span>TF: <strong className="text-white">{data.timeframe}</strong></span>
            <span>Refreshed: {new Date(data.lastUpdatedTimestamp).toLocaleTimeString()}</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 text-[9px] text-slate-400 font-sans flex items-start gap-1.5 border border-slate-800/80">
            <Info className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
            <span>
              <strong>Smart Money Methodology:</strong> Buyer and seller pressure percentages reflect taker volume, cumulative volume delta, and order book depth imbalance. Percentages NEVER represent counts of individual traders.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
