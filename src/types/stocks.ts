export type AssetMode = 'crypto' | 'stocks';

export type StockMarketId = 
  | 'US' 
  | 'NSE' 
  | 'LSE' 
  | 'TSE' 
  | 'HKEX' 
  | 'XETRA' 
  | 'TSX' 
  | 'PSX';

export type StockDataProvider = 'twelvedata' | 'finnhub' | 'alphavantage' | 'yahoo_compatible' | 'demo_bundled';

export type MarketSessionStatus = 
  | 'OPEN' 
  | 'CLOSED' 
  | 'PRE-MARKET' 
  | 'AFTER-HOURS' 
  | 'OBSERVING'; // First 15m opening volatility observation

export type PriceZone = 'HIGH' | 'UPPER-MID' | 'FAIR' | 'LOWER-MID' | 'LOW';

export type StockSignalType = 'BUY' | 'SELL' | 'WAIT';

export interface StockMarketInfo {
  id: StockMarketId;
  name: string;
  fullName: string;
  country: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  ianaTimeZone: string;
  regularOpen: string; // "09:30"
  regularClose: string; // "16:00"
  preMarketOpen?: string; // "04:00"
  afterHoursClose?: string; // "20:00"
  lunchBreakStart?: string; // For TSE/HKEX
  lunchBreakEnd?: string;
  fridaySpecialSchedule?: {
    morningOpen: string;
    morningClose: string;
    afternoonOpen: string;
    afternoonClose: string;
  };
  benchmarkIndex: string;
  benchmarkName: string;
  requiresVerification?: boolean; // For NSE & PSX
  holidays2025: string[]; // YYYY-MM-DD
}

export interface StockAsset {
  ticker: string;
  name: string;
  market: StockMarketId;
  sector: string;
  industry?: string;
  currency: string;
  currencySymbol: string;
  currentPrice: number;
  previousClose: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  change24h: number;
  changePercent24h: number;
  volume: number;
  avgVolume20d: number;
  rvol: number;
  spreadPercent: number;
  high52w: number;
  low52w: number;
  marketCapBln: number;
  peRatio?: number;
  nextEarningsDate?: string; // YYYY-MM-DD
  daysToEarnings?: number;
  isFavorite?: boolean;
}

export interface StockFactorDetail {
  id: string;
  name: string;
  category: 
    | 'Trend' 
    | 'Momentum' 
    | 'Volatility' 
    | 'Volume' 
    | 'Structure' 
    | 'IndexContext' 
    | 'EarningsRisk';
  vote: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -100 to 100
  summary: string;
  metrics: { [key: string]: string | number };
}

export interface PricePositionGuidance {
  zone: PriceZone;
  score: number; // 0 (extreme low) to 100 (extreme high)
  currentPrice: number;
  fairValuePrice: number; // VWAP / 20 EMA
  supportPrice: number;
  resistancePrice: number;
  headline: string;
  guidanceText: string;
  disclaimer: string;
}

export interface StockSignalResult {
  id: string;
  timestamp: number;
  market: StockMarketId;
  ticker: string;
  companyName: string;
  sector: string;
  currency: string;
  currencySymbol: string;
  signal: StockSignalType;
  entryPrice: number;
  entryZone: { min: number; max: number };
  stopLoss: number;
  stopLossReason: string;
  stopLossPercent: number;
  targetPrice1: number;
  targetPrice2: number;
  targetPrice3: number;
  riskRewardRatio: number;
  agreementScore: number; // 0 - 100
  timeframe: string;
  suggestedBuyTime: string; // e.g. "Best entry window: 10:15 - 11:30 AM"
  estimatedHoldingTime: string; // e.g. "Intraday (exit before 15:30)" or "Swing (1-3 days)"
  validUntil: string;
  validDurationMinutes: number;
  passedStrictMode: boolean;
  strictModeReasons: string[];
  earningsWarning?: {
    earningsDate: string;
    daysLeft: number;
    warningText: string;
  };
  pricePosition: PricePositionGuidance;
  factors: StockFactorDetail[];
  factorsSummary: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    totalFactors: number;
    topFactorsFor: string[];
    topFactorsAgainst: string[];
  };
  rvol: number;
  benchmarkContext: {
    indexSymbol: string;
    indexTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    indexChangePercent: number;
  };
  isDelayedData: boolean;
}

export interface StockPaperTrade {
  id: string;
  market: StockMarketId;
  ticker: string;
  companyName: string;
  currency: string;
  currencySymbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  shares: number;
  positionValue: number;
  stopLoss: number;
  targetPrice1: number;
  targetPrice2: number;
  openedAt: number;
  timeLimitExpiresAt: number;
  status: 'ACTIVE' | 'CLOSED_PROFIT' | 'CLOSED_LOSS' | 'CLOSED_EXPIRED' | 'CLOSED_MANUAL';
  closedAt?: number;
  exitPrice?: number;
  pnl: number;
  pnlPercent: number;
  notes?: string;
}

export interface StockUserSettings {
  dataProvider: StockDataProvider;
  apiKeyTwelveData: string;
  apiKeyFinnhub: string;
  apiKeyAlphaVantage: string;
  customYahooProxyUrl: string;
  enableShortSelling: boolean; // default false
  observationPeriodMinutes: number; // default 15
  customTradingWindowEnabled: boolean;
  customTradingStart: string; // "10:00"
  customTradingEnd: string; // "14:30"
  strictMode: boolean; // default true
  virtualBalances: Record<StockMarketId, number>; // default 10,000 per currency
  maxDailyLossPercent: number; // default 3%
  maxOpenTrades: number; // default 3
  riskPerTradePercent: number; // default 1% (max 2%)
  coolDownMinutesAfterConsecutiveLosses: number; // default 30m
  lastTwoTradesLoss: boolean;
  coolDownUntilTimestamp?: number;
  consecutiveLossCount: number;
}
