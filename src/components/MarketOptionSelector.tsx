import React, { useState } from 'react';
import { MarketOptionId, CryptoPair } from '../types/crypto';
import { Search, Globe, Flame, Star, Zap } from 'lucide-react';
import { playClickSound } from '../services/audio';

interface MarketOptionSelectorProps {
  selectedMarketOption: MarketOptionId;
  onSelectMarketOption: (option: MarketOptionId) => void;
  pairs: CryptoPair[];
  selectedPair: CryptoPair | null;
  onSelectPair: (pair: CryptoPair) => void;
  isLoadingPairs?: boolean;
}

export const MarketOptionSelector: React.FC<MarketOptionSelectorProps> = ({
  selectedMarketOption,
  onSelectMarketOption,
  pairs,
  selectedPair,
  onSelectPair,
  isLoadingPairs = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const marketOptions: { id: MarketOptionId; name: string; exchange: string; marketType: string; badge: string; color: string }[] = [
    { id: 'BINANCE_SPOT', name: 'BINANCE SPOT', exchange: 'Binance', marketType: 'Spot', badge: 'SPOT', color: 'emerald' },
    { id: 'BINANCE_FUTURES', name: 'BINANCE FUTURES', exchange: 'Binance', marketType: 'Futures', badge: 'PERP', color: 'cyan' },
    { id: 'BITGET_SPOT', name: 'BITGET SPOT', exchange: 'Bitget', marketType: 'Spot', badge: 'SPOT', color: 'emerald' },
    { id: 'BITGET_FUTURES', name: 'BITGET FUTURES', exchange: 'Bitget', marketType: 'Futures', badge: 'PERP', color: 'cyan' },
  ];

  const filteredPairs = pairs.filter((p) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      p.symbol.toLowerCase().includes(query) ||
      p.displayName.toLowerCase().includes(query) ||
      p.baseAsset.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 shadow-xl font-mono text-slate-100 space-y-3">
      {/* 4 Market Option Segmented Control */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            SELECT EXCHANGE & MARKET TYPE
          </span>
          <span className="text-[10px] text-cyan-400 font-bold">
            {pairs.length} Pairs Loaded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {marketOptions.map((opt) => {
            const isSelected = selectedMarketOption === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  playClickSound();
                  onSelectMarketOption(opt.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                  isSelected
                    ? opt.marketType === 'Spot'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-lg glow-green'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-lg glow-cyan'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-[11px]">{opt.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded mt-0.5 font-bold ${
                  isSelected 
                    ? opt.marketType === 'Spot' ? 'bg-emerald-500 text-slate-950' : 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {opt.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pair Search Filter & Quick Select Bar */}
      <div className="pt-1 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trading pair (e.g. BTC, ETH, SOL)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        {/* Horizontal Scrollable Pair Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {isLoadingPairs ? (
            <div className="text-xs text-slate-500 animate-pulse py-1">Loading pairs...</div>
          ) : filteredPairs.length === 0 ? (
            <div className="text-xs text-slate-500 py-1">No pairs found matching "{searchTerm}"</div>
          ) : (
            filteredPairs.slice(0, 25).map((pair) => {
              const isSelected = selectedPair?.symbol === pair.symbol;
              return (
                <button
                  key={pair.symbol}
                  onClick={() => {
                    playClickSound();
                    onSelectPair(pair);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold shrink-0 transition cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {pair.displayName}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
