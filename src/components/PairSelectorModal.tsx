import React, { useState, useMemo } from 'react';
import { Search, Star, X, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { CryptoPair, ProductType } from '../types/crypto';
import { playClickSound } from '../services/audio';
import { formatCryptoPrice } from '../utils/formatters';

interface PairSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: CryptoPair[];
  selectedPair: CryptoPair | null;
  onSelectPair: (pair: CryptoPair) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  activeProductType: ProductType;
  onChangeProductType: (productType: ProductType) => void;
  exchange: 'binance' | 'bitget';
  isUsingFallback?: boolean;
}

export const PairSelectorModal: React.FC<PairSelectorModalProps> = ({
  isOpen,
  onClose,
  pairs,
  selectedPair,
  onSelectPair,
  favorites,
  onToggleFavorite,
  activeProductType,
  onChangeProductType,
  exchange,
  isUsingFallback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'name' | 'change'>('volume');

  const exchangeName = exchange === 'binance' ? 'Binance Futures' : 'Bitget Futures';

  const filteredPairs = useMemo(() => {
    let list = pairs;

    if (filterTab === 'favorites') {
      const favSet = new Set(favorites);
      list = list.filter((p) => favSet.has(p.symbol));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.symbol.toLowerCase().includes(q) ||
          p.baseAsset.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === 'volume') {
        return (b.volume24h || 0) - (a.volume24h || 0);
      } else if (sortBy === 'name') {
        return a.symbol.localeCompare(b.symbol);
      } else if (sortBy === 'change') {
        return (b.priceChangePercent24h || 0) - (a.priceChangePercent24h || 0);
      }
      return 0;
    });
  }, [pairs, filterTab, favorites, searchQuery, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-md h-[88vh] rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl glow-cyan overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wide text-white">Select Perpetual Contract</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              {exchange}
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fallback Warning Banner if offline list is used */}
        {isUsingFallback && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-amber-300">
            <span>⚠️ Using offline pair list, may be outdated</span>
            <span className="text-[10px] text-amber-400">Offline Cache</span>
          </div>
        )}

        {/* Total Loaded Count Status Banner */}
        <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
          <span>Loaded {pairs.length} pairs from {exchangeName}</span>
          <span className="text-slate-500">{activeProductType}</span>
        </div>

        {/* Contract Type Tabs */}
        <div className="px-3 pt-2 pb-1 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          {exchange === 'binance' ? (
            <>
              <button
                onClick={() => {
                  playClickSound();
                  onChangeProductType('USDT-M');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeProductType === 'USDT-M'
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                USDT-M Perpetuals
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  onChangeProductType('COIN-M');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeProductType === 'COIN-M'
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                COIN-M Margined
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  playClickSound();
                  onChangeProductType('USDT-FUTURES');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeProductType === 'USDT-FUTURES'
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                USDT-Futures
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  onChangeProductType('USDC-FUTURES');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeProductType === 'USDC-FUTURES'
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                USDC-Futures
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  onChangeProductType('COIN-FUTURES');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeProductType === 'COIN-FUTURES'
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Coin-Futures
              </button>
            </>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400/80" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol (e.g. BTC, ETH, SOL)..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Tab: All vs Favorites */}
          <button
            onClick={() => {
              playClickSound();
              setFilterTab(filterTab === 'all' ? 'favorites' : 'all');
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              filterTab === 'favorites'
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Favorites Only"
          >
            <Star className={`h-4 w-4 ${filterTab === 'favorites' ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Sort By Toggle */}
          <button
            onClick={() => {
              playClickSound();
              setSortBy(sortBy === 'volume' ? 'change' : (sortBy === 'change' ? 'name' : 'volume'));
            }}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-cyan-400 font-mono hover:border-slate-700 transition cursor-pointer"
            title="Change sorting"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span className="capitalize">{sortBy}</span>
          </button>
        </div>

        {/* Pairs List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs gap-2">
              <Search className="h-8 w-8 text-slate-600" />
              <span>No perpetual symbols found</span>
              <span className="text-[10px] text-slate-600 font-mono">Try clearing filters or search terms</span>
            </div>
          ) : (
            filteredPairs.map((pair) => {
              const isSelected = selectedPair?.symbol === pair.symbol;
              const isFav = favorites.includes(pair.symbol);
              const changeVal = pair.priceChangePercent24h || 0;
              const isPos = changeVal >= 0;

              return (
                <div
                  key={pair.symbol}
                  onClick={() => {
                    playClickSound();
                    onSelectPair(pair);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500/50 text-white'
                      : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  {/* Left: Star + Symbol */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        onToggleFavorite(pair.symbol);
                      }}
                      className="p-1 text-slate-500 hover:text-amber-400 transition"
                    >
                      <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white tracking-wide">{pair.displayName}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                          PERP
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Vol: ${(pair.volume24h ? (pair.volume24h / 1_000_000).toFixed(1) : '0')}M
                      </div>
                    </div>
                  </div>

                  {/* Right: Last Price + 24h Change */}
                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold text-slate-100">
                      {formatCryptoPrice(pair.lastPrice, pair.pricePrecision)}
                    </div>
                    <div className={`flex items-center justify-end gap-0.5 text-[10px] font-mono font-bold ${
                      isPos ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isPos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      <span>{isPos ? '+' : ''}{changeVal.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono bg-slate-950">
          <span>{filteredPairs.length} pairs loaded</span>
          <span>Auto-refreshes on launch</span>
        </div>
      </div>
    </div>
  );
};
