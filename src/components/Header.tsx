import React from 'react';
import { 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Coins,
  Building2,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { ExchangeId, Timeframe, CryptoPair } from '../types/crypto';
import { AssetMode, StockMarketId, StockAsset } from '../types/stocks';
import { STOCK_MARKETS } from '../config/marketHours';
import { playClickSound } from '../services/audio';
import { formatCryptoPrice } from '../utils/formatters';

const TIMEFRAMES: Timeframe[] = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];

const STOCK_MARKET_OPTIONS: { id: StockMarketId; shortLabel: string; flag: string; verify?: boolean }[] = [
  { id: 'US', shortLabel: 'US', flag: '🇺🇸' },
  { id: 'NSE', shortLabel: 'NSE', flag: '🇮🇳', verify: true },
  { id: 'LSE', shortLabel: 'LSE', flag: '🇬🇧' },
  { id: 'TSE', shortLabel: 'TSE', flag: '🇯🇵' },
  { id: 'HKEX', shortLabel: 'HKEX', flag: '🇭🇰' },
  { id: 'XETRA', shortLabel: 'Xetra', flag: '🇩🇪' },
  { id: 'TSX', shortLabel: 'TSX', flag: '🇨🇦' },
  { id: 'PSX', shortLabel: 'PSX', flag: '🇵🇰', verify: true },
];

interface HeaderProps {
  // Asset mode
  assetMode: AssetMode;
  onAssetModeChange: (mode: AssetMode) => void;

  // Crypto Props
  exchange: ExchangeId;
  onExchangeChange: (ex: ExchangeId) => void;
  selectedPair: CryptoPair | null;
  onOpenPairModal: () => void;
  livePrice?: number;
  priceChangePercent24h?: number;

  // Stocks Props
  stockMarket: StockMarketId;
  onStockMarketChange: (m: StockMarketId) => void;
  selectedStock: StockAsset | null;
  onOpenStockModal: () => void;

  // Common Props
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  strictMode: boolean;
  onOpenCalculator: () => void;
  onOpenCalendarModal?: () => void;
  hasActiveEventWindow?: boolean;
  onSelectPocketOption?: () => void;
  onSelectQuotex?: () => void;
  onSelectCompounding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  assetMode,
  onAssetModeChange,
  exchange,
  onExchangeChange,
  selectedPair,
  onOpenPairModal,
  livePrice,
  priceChangePercent24h,
  stockMarket,
  onStockMarketChange,
  selectedStock,
  onOpenStockModal,
  timeframe,
  onTimeframeChange,
  soundEnabled,
  onToggleSound,
  strictMode,
  onOpenCalculator,
  onOpenCalendarModal,
  hasActiveEventWindow = false,
  onSelectPocketOption,
  onSelectQuotex,
  onSelectCompounding,
}) => {
  const isPosCrypto = (priceChangePercent24h || 0) >= 0;
  const isPosStock = (selectedStock?.changePercent24h || 0) >= 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-cyan-500/30 shadow-lg px-3 py-2.5 flex flex-col gap-2.5">
      {/* Asset Switch: Crypto Futures | Stocks */}
      <div className="flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/60 shadow glow-cyan">
            <svg className="w-5 h-5" viewBox="0 0 512 512" fill="none">
              <circle cx="256" cy="256" r="210" stroke="#06b6d4" strokeWidth="20" strokeOpacity="0.4" strokeDasharray="30 20" />
              <circle cx="256" cy="256" r="110" stroke="#22d3ee" strokeWidth="16" />
              <path d="M 140 256 L 210 256 L 235 180 L 265 330 L 295 210 L 320 256 L 372 256" stroke="#00f2fe" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                CYBERPULSE
              </span>
              <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                PRO
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono tracking-tight -mt-0.5">
              {assetMode === 'crypto' ? 'FUTURES RADAR' : 'STOCK RADAR'}
            </div>
          </div>
        </div>

        {/* Mode Switch: Crypto Futures | Stocks */}
        <div className="flex items-center bg-slate-900 border border-cyan-500/40 rounded-xl p-0.5 shadow-inner">
          <button
            onClick={() => {
              playClickSound();
              onAssetModeChange('crypto');
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              assetMode === 'crypto'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-sm glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Crypto</span>
          </button>
          <button
            onClick={() => {
              playClickSound();
              onAssetModeChange('stocks');
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              assetMode === 'stocks'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-sm glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Stocks</span>
          </button>
        </div>

        {/* Sound & Strict Badges */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playClickSound();
              onToggleSound();
            }}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={() => {
              playClickSound();
              onOpenCalculator();
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-slate-700 transition cursor-pointer"
            title="Open Position Size & Risk Calculator"
          >
            <Calculator className="h-4 w-4" />
          </button>

          {onOpenCalendarModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenCalendarModal();
              }}
              className={`p-1.5 rounded-lg border transition cursor-pointer relative ${
                hasActiveEventWindow
                  ? 'bg-amber-950/80 border-amber-500 text-amber-400 animate-pulse glow-amber'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400'
              }`}
              title={hasActiveEventWindow ? 'High-Impact Event Active (±30m Window)!' : 'Economic Event Calendar & Window Protection'}
            >
              <Calendar className="h-4 w-4" />
              {hasActiveEventWindow && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono font-medium ${
              strictMode
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title={strictMode ? 'Strict Mode Active (6+ factors required)' : 'Normal Mode Active'}
          >
            <ShieldCheck className="h-3 w-3 text-cyan-400" />
            <span>{strictMode ? 'STRICT' : 'NORMAL'}</span>
          </div>
        </div>
      </div>

      {/* Row 2: In Crypto -> Exchange & Strategy Mode Toggle. In Stocks -> 8 Markets Selector */}
      {assetMode === 'crypto' ? (
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {/* Exchange & Strategy Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 w-full font-mono text-[11px]">
            <button
              onClick={() => {
                playClickSound();
                onExchangeChange('binance');
              }}
              className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                exchange === 'binance'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Binance Futures
            </button>
            <button
              onClick={() => {
                playClickSound();
                onExchangeChange('bitget');
              }}
              className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                exchange === 'bitget'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bitget Futures
            </button>
            <button
              onClick={() => {
                playClickSound();
                if (onSelectPocketOption) onSelectPocketOption();
              }}
              className="py-1 px-2 text-[10px] font-semibold rounded-lg text-emerald-400 hover:text-emerald-300 transition cursor-pointer whitespace-nowrap bg-emerald-950/40 border border-emerald-500/30"
              title="Open Pocket Option High-Frequency Binary/Options Terminal"
            >
              Pocket Option Page
            </button>
            <button
              onClick={() => {
                playClickSound();
                if (onSelectQuotex) onSelectQuotex();
              }}
              className="py-1 px-2 text-[10px] font-semibold rounded-lg text-cyan-400 hover:text-cyan-300 transition cursor-pointer whitespace-nowrap bg-cyan-950/40 border border-cyan-500/30"
              title="Open Quotex Digital Options Terminal"
            >
              Quotex Page
            </button>
            <button
              onClick={() => {
                playClickSound();
                if (onSelectCompounding) onSelectCompounding();
              }}
              className="py-1 px-2 text-[10px] font-bold rounded-lg text-amber-300 hover:text-amber-200 transition cursor-pointer whitespace-nowrap bg-amber-950/60 border border-amber-500/50 shadow glow-amber"
              title="Open Smart $5 Auto Compounding Trading System"
            >
              🌱 $5 Auto Compound
            </button>
          </div>
        </div>
      ) : (
        /* Stocks: 8 International Markets Selector */
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {STOCK_MARKET_OPTIONS.map(opt => {
            const isSelected = stockMarket === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  playClickSound();
                  onStockMarketChange(opt.id);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm glow-cyan'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.shortLabel}</span>
                {opt.verify && (
                  <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-amber-950 text-amber-400'
                  }`}>
                    *
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Row 3: Selector Button with Live Ticker */}
      {assetMode === 'crypto' ? (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              playClickSound();
              onOpenPairModal();
            }}
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer glow-cyan-border"
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wide">
                {selectedPair ? selectedPair.displayName : 'Select Pair'}
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                {selectedPair?.productType || 'PERP'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {livePrice ? (
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-100">
                    {formatCryptoPrice(livePrice, selectedPair?.pricePrecision)}
                  </span>
                  <span className={`ml-1.5 text-[10px] font-mono font-semibold ${isPosCrypto ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPosCrypto ? '+' : ''}{(priceChangePercent24h || 0).toFixed(2)}%
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Loading data...</span>
              )}
              <ChevronDown className="h-4 w-4 text-cyan-400" />
            </div>
          </button>
        </div>
      ) : (
        /* Stocks: Stock Selector Button */
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              playClickSound();
              onOpenStockModal();
            }}
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer glow-cyan-border"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{STOCK_MARKETS[stockMarket].flag}</span>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white font-mono tracking-wide">
                    {selectedStock ? selectedStock.ticker : 'Select Stock'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                    {stockMarket}
                  </span>
                </div>
                {selectedStock && (
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                    {selectedStock.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {selectedStock ? (
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-slate-100">
                    {selectedStock.currencySymbol}{selectedStock.currentPrice.toFixed(2)}
                  </div>
                  <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                    isPosStock ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isPosStock ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {isPosStock ? '+' : ''}{selectedStock.changePercent24h.toFixed(2)}%
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Choose stock...</span>
              )}
              <ChevronDown className="h-4 w-4 text-cyan-400" />
            </div>
          </button>
        </div>
      )}

      {/* Row 4: Timeframe Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {TIMEFRAMES.map((tf) => {
          const isActive = timeframe === tf;
          return (
            <button
              key={tf}
              onClick={() => {
                playClickSound();
                onTimeframeChange(tf);
              }}
              className={`flex-1 min-w-[36px] py-1 text-center rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-400 to-blue-500 text-slate-950 shadow-md font-bold glow-cyan'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tf}
            </button>
          );
        })}
      </div>
    </header>
  );
};
