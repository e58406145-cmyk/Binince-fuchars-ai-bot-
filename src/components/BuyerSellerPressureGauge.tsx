import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ShieldCheck, 
  Activity, 
  AlertCircle, 
  Clock, 
  Layers, 
  Zap, 
  Info 
} from 'lucide-react';
import { ExchangeId, Timeframe, CryptoPair } from '../types/crypto';
import { 
  BuyerSellerPressureResult, 
  calculateBuyerSellerPressure 
} from '../services/buyerSellerPressureEngine';
import { playClickSound } from '../services/audio';

interface BuyerSellerPressureGaugeProps {
  exchange: ExchangeId;
  selectedPair: CryptoPair | null;
  timeframe: Timeframe;
}

export const BuyerSellerPressureGauge: React.FC<BuyerSellerPressureGaugeProps> = ({
  exchange,
  selectedPair,
  timeframe,
}) => {
  const [data, setData] = useState<BuyerSellerPressureResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPressureData = useCallback(async () => {
    if (!selectedPair) return;
    setIsLoading(true);
    try {
      const res = await calculateBuyerSellerPressure(
        exchange,
        selectedPair.symbol,
        timeframe,
        selectedPair.productType
      );
      setData(res);
    } catch {
      setData({
        buyerPressurePercent: 50,
        sellerPressurePercent: 50,
        status: 'NEUTRAL',
        isDataAvailable: false,
        timestamp: Date.now(),
        timeframe,
        dataSource: exchange === 'binance' ? 'Binance Futures REST API' : 'Bitget Futures REST API',
        takerBuyPercent: 50,
        orderBookBuyPercent: 50,
        longAccountPercent: 50,
      });
    } finally {
      setIsLoading(false);
    }
  }, [exchange, selectedPair, timeframe]);

  // Initial load & periodic refresh
  useEffect(() => {
    fetchPressureData();
    const interval = setInterval(fetchPressureData, 10000); // 10s live refresh
    return () => clearInterval(interval);
  }, [fetchPressureData]);

  if (!selectedPair) return null;

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-4 shadow-xl font-mono text-slate-100 space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                BUYER vs SELLER PRESSURE
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                {selectedPair.displayName}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-sans">
              Real Taker Volume & Order Depth Ratio
            </div>
          </div>
        </div>

        {/* Live Refresh Button */}
        <button
          onClick={() => {
            playClickSound();
            fetchPressureData();
          }}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-40"
          title="Refresh Pressure Data"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Main Data Display */}
      {data && data.isDataAvailable ? (
        <div className="space-y-3">
          {/* Pressure Percentage Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black font-mono">
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4 stroke-[3]" />
                <span>BUYER PRESSURE: {data.buyerPressurePercent}%</span>
              </div>

              <div className="flex items-center gap-1 text-rose-400">
                <span>SELLER PRESSURE: {data.sellerPressurePercent}%</span>
                <TrendingDown className="h-4 w-4 stroke-[3]" />
              </div>
            </div>

            {/* Split Progress Bar */}
            <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${data.buyerPressurePercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-rose-500 to-rose-600 h-full transition-all duration-500"
                style={{ width: `${data.sellerPressurePercent}%` }}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl text-xs font-mono">
            <span className="text-slate-400 text-[10px]">Dominance Classification:</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              data.status === 'BUYER_DOMINANT'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 glow-green'
                : data.status === 'SELLER_DOMINANT'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/50 glow-red'
                : 'bg-amber-950 text-amber-300 border border-amber-500/50'
            }`}>
              {data.status === 'BUYER_DOMINANT' ? '⚡ BUYER DOMINANT (ACCUMULATION)' :
               data.status === 'SELLER_DOMINANT' ? '🚨 SELLER DOMINANT (DISTRIBUTION)' :
               '⚖️ NEUTRAL / MIXED ORDER FLOW'}
            </span>
          </div>

          {/* Sub-Factors Breakdown Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center font-mono">
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px]">Taker Buy Vol</span>
              <span className="font-bold text-emerald-400">{data.takerBuyPercent}%</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px]">Bid Book Depth</span>
              <span className="font-bold text-cyan-300">{data.orderBookBuyPercent}%</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px]">Long Account %</span>
              <span className="font-bold text-amber-400">{data.longAccountPercent}%</span>
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/80 pt-1.5 font-mono">
            <span>Source: {data.dataSource}</span>
            <span>TF: {data.timeframe}</span>
            <span>Refreshed: {new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        /* DATA UNAVAILABLE WARNING STATE */
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-mono space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="font-bold">DATA UNAVAILABLE</span>
          </div>
          <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
            Market data endpoint currently unavailable or rate limited. Never displays fabricated or fake percentages.
          </p>
          <button
            onClick={() => {
              playClickSound();
              fetchPressureData();
            }}
            className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Safety Compliance Note */}
      <div className="p-2 rounded-xl bg-slate-950 text-[9px] text-slate-500 font-sans flex items-start gap-1.5 border border-slate-800/60">
        <Info className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
        <span>
          <strong>Integration Safety:</strong> This indicator measures taker order flow and depth imbalance. It is NOT a standalone trade trigger and must be combined with EMA, RSI, MACD, ADX, Bollinger Bands, and Volume confirmation.
        </span>
      </div>
    </div>
  );
};
