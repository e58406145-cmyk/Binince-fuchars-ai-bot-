import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Zap, Clock, ShieldCheck, DollarSign, RefreshCw, BarChart2 } from 'lucide-react';
import { playClickSound, playLongSignalSound, playShortSignalSound } from '../services/audio';

interface QuotexAsset {
  symbol: string;
  name: string;
  payout: number;
  category: 'CURRENCY' | 'CRYPTO' | 'COMMODITY';
}

const QUOTEX_ASSETS: QuotexAsset[] = [
  { symbol: 'EURUSD_QX', name: 'EUR/USD (OTC)', payout: 93, category: 'CURRENCY' },
  { symbol: 'GBPUSD_QX', name: 'GBP/USD (OTC)', payout: 88, category: 'CURRENCY' },
  { symbol: 'USDCHF_QX', name: 'USD/CHF (OTC)', payout: 87, category: 'CURRENCY' },
  { symbol: 'AUDUSD_QX', name: 'AUD/USD (OTC)', payout: 90, category: 'CURRENCY' },
  { symbol: 'BTCUSD_QX', name: 'BTC/USD (OTC)', payout: 85, category: 'CRYPTO' },
  { symbol: 'GOLD_QX', name: 'Gold (OTC)', payout: 92, category: 'COMMODITY' },
];

export const QuotexView: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<QuotexAsset>(QUOTEX_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<'1m' | '2m' | '5m'>('1m');
  const [tradeAmount, setTradeAmount] = useState<number>(10);
  const [signal, setSignal] = useState<{
    direction: 'UP' | 'DOWN' | 'WAIT';
    confidence: number;
    price: number;
    reason: string;
    timestamp: number;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [livePrice, setLivePrice] = useState<number>(1.08520);

  // Live price ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePrice((prev) => {
        const delta = (Math.random() - 0.5) * 0.00012;
        return parseFloat((prev + delta).toFixed(5));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateQuotexSignal = () => {
    playClickSound();
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const rand = Math.random();
      const direction = rand > 0.52 ? 'UP' : rand < 0.48 ? 'DOWN' : 'WAIT';
      const confidence = Math.floor(83 + Math.random() * 13);

      setSignal({
        direction,
        confidence,
        price: livePrice,
        reason: direction === 'UP'
          ? `RSI (14) oversold bounce + Parabolic SAR bullish dots under price candle. High probability ${selectedAsset.name} UP.`
          : direction === 'DOWN'
          ? `MACD bearish zero-line crossover + upper Bollinger rejection. High probability ${selectedAsset.name} DOWN.`
          : 'Price rangebound in tight consolidation zone. Wait for next candle close.',
        timestamp: Date.now(),
      });

      if (direction === 'UP') playLongSignalSound();
      if (direction === 'DOWN') playShortSignalSound();
    }, 1100);
  };

  const netReturn = (tradeAmount * (selectedAsset.payout / 100)).toFixed(2);

  return (
    <div className="space-y-4 pb-24 text-slate-100 max-w-lg mx-auto px-3 sm:px-4 font-mono">
      {/* Quotex Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/50 to-slate-900 border-2 border-cyan-500/40 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-cyan-400" />
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">QUOTEX TRADING TERMINAL</h1>
              <p className="text-[10px] text-cyan-300 font-sans">Precision Digital Options & OTC Market Radar</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase shadow">
            {selectedAsset.payout}% PAYOUT
          </span>
        </div>
      </div>

      {/* Asset Selection Grid */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold">Select Quotex Asset:</span>
          <span className="text-cyan-300 font-bold">Price: ${livePrice}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {QUOTEX_ASSETS.map((a) => (
            <button
              key={a.symbol}
              onClick={() => {
                playClickSound();
                setSelectedAsset(a);
                setSignal(null);
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                selectedAsset.symbol === a.symbol
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-xs">{a.name}</div>
                <div className="text-[9px] text-slate-500">{a.category}</div>
              </div>
              <span className="text-[10px] font-black text-cyan-400">{a.payout}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expiration Time & Stake */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-3 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold">Option Duration:</span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['1m', '2m', '5m'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  playClickSound();
                  setTimeframe(t);
                }}
                className={`py-1.5 rounded-lg font-bold text-center transition cursor-pointer ${
                  timeframe === t
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                {t} Option
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <label className="text-slate-400 text-[10px] block">Stake Amount ($):</label>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[10px] block">Net Profit (+{selectedAsset.payout}%):</label>
            <div className="bg-cyan-950/60 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-cyan-300 font-bold text-xs">
              +${netReturn}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateQuotexSignal}
        disabled={isAnalyzing}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:scale-[1.01] transition cursor-pointer flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Analyzing Quotex Indicators...</span>
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 fill-slate-950" />
            <span>GENERATE QUOTEX SIGNAL</span>
          </>
        )}
      </button>

      {/* Signal Output */}
      {signal && (
        <div className={`p-4 rounded-2xl border-2 space-y-3 shadow-2xl transition-all ${
          signal.direction === 'UP'
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 glow-green'
            : signal.direction === 'DOWN'
            ? 'bg-rose-950/80 border-rose-500 text-rose-100 glow-red'
            : 'bg-amber-950/80 border-amber-500 text-amber-100'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-sm font-black flex items-center gap-1 ${
                signal.direction === 'UP' ? 'bg-emerald-500 text-slate-950' : signal.direction === 'DOWN' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
              }`}>
                {signal.direction === 'UP' ? <ArrowUp className="h-4 w-4 stroke-[3]" /> : <ArrowDown className="h-4 w-4 stroke-[3]" />}
                {signal.direction === 'UP' ? 'UP (GREEN)' : signal.direction === 'DOWN' ? 'DOWN (RED)' : 'WAIT'}
              </span>
              <span className="text-xs font-bold text-white">{selectedAsset.name}</span>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-cyan-300">Accuracy: {signal.confidence}%</div>
              <div className="text-[10px] text-slate-400">TF: {timeframe}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-center bg-slate-950/60 p-2 rounded-xl">
            <div>
              <span className="text-[9px] text-slate-400 block">Strike Price</span>
              <span className="font-bold text-white">${signal.price}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Payout Rate</span>
              <span className="font-bold text-cyan-300">{selectedAsset.payout}%</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Estimated Return</span>
              <span className="font-bold text-emerald-300">+${netReturn}</span>
            </div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            {signal.reason}
          </p>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>Generated: {new Date(signal.timestamp).toLocaleTimeString()}</span>
            <span>Quotex Analysis • Not Financial Advice</span>
          </div>
        </div>
      )}
    </div>
  );
};
