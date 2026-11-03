import React, { useState, useMemo } from 'react';
import { Search, Star, X, TrendingUp, TrendingDown, AlertTriangle, Building2 } from 'lucide-react';
import { StockAsset, StockMarketId } from '../types/stocks';
import { STOCK_MARKETS } from '../config/marketHours';

interface StockSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId: StockMarketId;
  stocks: StockAsset[];
  selectedTicker: string;
  onSelectStock: (stock: StockAsset) => void;
  favorites: string[];
  onToggleFavorite: (ticker: string) => void;
}

export const StockSelectorModal: React.FC<StockSelectorModalProps> = ({
  isOpen,
  onClose,
  marketId,
  stocks,
  selectedTicker,
  onSelectStock,
  favorites,
  onToggleFavorite
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'earnings'>('all');

  const marketInfo = STOCK_MARKETS[marketId];

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const q = search.toLowerCase().trim();
      const matchQuery = 
        !q ||
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (filterTab === 'favorites') {
        return favorites.includes(stock.ticker);
      }
      if (filterTab === 'earnings') {
        return (stock.daysToEarnings ?? 99) <= 3;
      }
      return true;
    });
  }, [stocks, search, filterTab, favorites]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{marketInfo.flag}</span>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Select Stock</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {marketInfo.name}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {stocks.length} liquid constituents available
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ticker, company name, or sector..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                filterTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({stocks.length})
            </button>
            <button
              onClick={() => setFilterTab('favorites')}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                filterTab === 'favorites'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3 h-3 fill-current" /> Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setFilterTab('earnings')}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                filterTab === 'earnings'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Earnings Soon
            </button>
          </div>
        </div>

        {/* Stock List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-800/40">
          {filteredStocks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No matching stocks found for "{search}"
            </div>
          ) : (
            filteredStocks.map(stock => {
              const isFav = favorites.includes(stock.ticker);
              const isSelected = stock.ticker === selectedTicker;
              const isEarningsWarning = (stock.daysToEarnings ?? 99) <= 3;
              const isPos = stock.changePercent24h >= 0;

              return (
                <div
                  key={stock.ticker}
                  onClick={() => {
                    onSelectStock(stock);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500/80 shadow-md'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {/* Left: Star + Ticker + Company Name + Sector */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(stock.ticker);
                      }}
                      className={`p-1 rounded-lg transition ${
                        isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white tracking-wide font-mono">
                          {stock.ticker}
                        </span>
                        {isEarningsWarning && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600">
                            Earnings in {stock.daysToEarnings}d
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 truncate">
                        {stock.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5" /> {stock.sector}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + 24h Change + RVOL */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white font-mono">
                      {stock.currencySymbol}{stock.currentPrice.toFixed(2)}
                    </div>
                    <div className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPos ? '+' : ''}{stock.changePercent24h.toFixed(2)}%
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300/80">
                      RVOL {stock.rvol}x
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
