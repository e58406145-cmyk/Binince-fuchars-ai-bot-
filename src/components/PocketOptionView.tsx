import React, { useState, useEffect } from 'react';
import { Clock, ArrowUp, ArrowDown, Zap, Target, ShieldCheck, DollarSign, RefreshCw, Calculator, Award } from 'lucide-react';
import { playClickSound, playLongSignalSound, playShortSignalSound } from '../services/audio';

interface OtcPair {
  symbol: string;
  name: string;
  payoutPercent: number;
  category: 'OTC_FOREX' | 'OTC_STOCKS' | 'CRYPTO';
}

const OTC_PAIRS: OtcPair[] = [
  { symbol: 'EURUSD_OTC', name: 'EUR/USD (OTC)', payoutPercent: 92, category: 'OTC_FOREX' },
  { symbol: 'GBPUSD_OTC', name: 'GBP/USD (OTC)', payoutPercent: 89, category: 'OTC_FOREX' },
  { symbol: 'USDJPY_OTC', name: 'USD/JPY (OTC)', payoutPercent: 88, category: 'OTC_FOREX' },
  { symbol: 'AUDCAD_OTC', name: 'AUD/CAD (OTC)', payoutPercent: 91, category: 'OTC_FOREX' },
  { symbol: 'BTCUSD_OTC', name: 'Bitcoin (OTC)', payoutPercent: 85, category: 'CRYPTO' },
  { symbol: 'ETHUSD_OTC', name: 'Ethereum (OTC)', payoutPercent: 87, category: 'CRYPTO' },
  { symbol: 'AAPL_OTC', name: 'Apple Inc (OTC)', payoutPercent: 90, category: 'OTC_STOCKS' },
];

export const PocketOptionView: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<OtcPair>(OTC_PAIRS[0]);
  const [expiryTime, setExpiryTime] = useState<'5s' | '15s' | '30s' | '1m' | '5m'>('1m');
  const [investmentAmount, setInvestmentAmount] = useState<number>(10);
  const [signal, setSignal] = useState<{
    direction: 'CALL' | 'PUT' | 'WAIT';
    confidence: number;
    price: number;
    reason: string;
    timestamp: number;
  } | null>(null);

  const [isCalculating, setIsCalculating] = useState(false);
  const [mockPrice, setMockPrice] = useState<number>(1.08450);

  // Tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMockPrice((prev) => {
        const delta = (Math.random() - 0.49) * 0.00015;
        return parseFloat((prev + delta).toFixed(5));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGeneratePocketSignal = () => {
    playClickSound();
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      const rand = Math.random();
      const direction = rand > 0.52 ? 'CALL' : rand < 0.48 ? 'PUT' : 'WAIT';
      const confidence = Math.floor(82 + Math.random() * 14);
      setSignal({
        direction,
        confidence,
        price: mockPrice,
        reason: direction === 'CALL'
          ? `Parabolic SAR flip below candle with 3-second OTC momentum surge. High probability ${selectedPair.name} Call.`
          : direction === 'PUT'
          ? `Stochastic overbought rejection at resistance band with bearish candle engulfing. High probability ${selectedPair.name} Put.`
          : 'Price consolidating inside tight Bollinger Squeeze. Wait for breakout candle.',
        timestamp: Date.now(),
      });

      if (direction === 'CALL') playLongSignalSound();
      if (direction === 'PUT') playShortSignalSound();
    }, 1200);
  };

  const potentialProfit = (investmentAmount * (selectedPair.payoutPercent / 100)).toFixed(2);

  return (
    <div className="space-y-4 pb-24 text-slate-100 max-w-lg mx-auto px-3 sm:px-4 font-mono">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border-2 border-emerald-500/40 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">POCKET OPTION TERMINAL</h1>
              <p className="text-[10px] text-emerald-400 font-sans">High-Frequency Binary Options Radar (OTC & Crypto)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow">
            {selectedPair.payoutPercent}% PAYOUT
          </span>
        </div>
      </div>

      {/* OTC Pair Selection Grid */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold">Select OTC Market Pair:</span>
          <span className="text-emerald-400 font-bold">Live Price: ${mockPrice}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {OTC_PAIRS.map((p) => (
            <button
              key={p.symbol}
              onClick={() => {
                playClickSound();
                setSelectedPair(p);
                setSignal(null);
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                selectedPair.symbol === p.symbol
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-xs">{p.name}</div>
                <div className="text-[9px] text-slate-500">{p.category}</div>
              </div>
              <span className="text-[10px] font-black text-emerald-400">{p.payoutPercent}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expiration Time & Investment Inputs */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-3 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold">Trade Duration / Expiration:</span>
          <div className="grid grid-cols-5 gap-1">
            {(['5s', '15s', '30s', '1m', '5m'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  playClickSound();
                  setExpiryTime(t);
                }}
                className={`py-1.5 rounded-lg font-bold text-center transition cursor-pointer ${
                  expiryTime === t
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <label className="text-slate-400 text-[10px] block">Investment ($):</label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[10px] block">Estimated Return (+{selectedPair.payoutPercent}%):</label>
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-emerald-300 font-bold text-xs">
              +${potentialProfit}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Pocket Option Signal Button */}
      <button
        onClick={handleGeneratePocketSignal}
        disabled={isCalculating}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:scale-[1.01] transition cursor-pointer flex items-center justify-center gap-2"
      >
        {isCalculating ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Scanning OTC Order Flow...</span>
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 fill-slate-950" />
            <span>GENERATE POCKET OPTION SIGNAL</span>
          </>
        )}
      </button>

      {/* Signal Output Card */}
      {signal && (
        <div className={`p-4 rounded-2xl border-2 space-y-3 shadow-2xl transition-all ${
          signal.direction === 'CALL'
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 glow-green'
            : signal.direction === 'PUT'
            ? 'bg-rose-950/80 border-rose-500 text-rose-100 glow-red'
            : 'bg-amber-950/80 border-amber-500 text-amber-100'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-sm font-black flex items-center gap-1 ${
                signal.direction === 'CALL' ? 'bg-emerald-500 text-slate-950' : signal.direction === 'PUT' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
              }`}>
                {signal.direction === 'CALL' ? <ArrowUp className="h-4 w-4 stroke-[3]" /> : <ArrowDown className="h-4 w-4 stroke-[3]" />}
                {signal.direction === 'CALL' ? 'CALL (HIGHER / UP)' : signal.direction === 'PUT' ? 'PUT (LOWER / DOWN)' : 'WAIT'}
              </span>
              <span className="text-xs font-bold text-white">{selectedPair.name}</span>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400">Score: {signal.confidence}%</div>
              <div className="text-[10px] text-slate-400">Dur: {expiryTime}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-center bg-slate-950/60 p-2 rounded-xl">
            <div>
              <span className="text-[9px] text-slate-400 block">Entry Price</span>
              <span className="font-bold text-white">${signal.price}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Payout Rate</span>
              <span className="font-bold text-emerald-400">{selectedPair.payoutPercent}%</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Potential Win</span>
              <span className="font-bold text-emerald-300">+${potentialProfit}</span>
            </div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            {signal.reason}
          </p>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>Generated: {new Date(signal.timestamp).toLocaleTimeString()}</span>
            <span>Binary Option Analysis • Not Financial Advice</span>
          </div>
        </div>
      )}
    </div>
  );
};
