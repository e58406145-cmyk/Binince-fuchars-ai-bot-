export type ExchangeId = 'binance' | 'bitget';

export type MarketOptionId = 'BINANCE_SPOT' | 'BINANCE_FUTURES' | 'BITGET_SPOT' | 'BITGET_FUTURES';

export type MarketType = 'SPOT' | 'FUTURES';

export type ProductType = 
  | 'SPOT'
  | 'USDT-M' 
  | 'COIN-M' 
  | 'USDT-FUTURES' 
  | 'USDC-FUTURES' 
  | 'COIN-FUTURES';

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface SmartMoneyData {
  exchange: ExchangeId;
  marketType: MarketType;
  marketOptionId: MarketOptionId;
  symbol: string;
  displayName: string;
  globalLongShortRatio?: number;
  topTraderLongShortRatio?: number;
  openInterest?: number;
  openInterestValueUsd?: number;
  openInterestChangePercent24h?: number;
  fundingRate?: number;
  predictedFundingRate?: number;
  estimatedLiquidations24hUsd?: number;
  orderBookImbalancePercent: number;
  takerBuyVolume24h: number;
  takerSellVolume24h: number;
  buyerPressurePercent: number;
  sellerPressurePercent: number;
  cvd24h: number;
  smartMoneyDirection: 'ACCUMULATION' | 'BULLISH' | 'DISTRIBUTION' | 'BEARISH' | 'NEUTRAL';
  dataSource: string;
  lastUpdatedTimestamp: number;
  timeframe?: Timeframe;
  hasCoinGlassKey?: boolean;
}

export interface CryptoPair {
  symbol: string;           // e.g. "BTCUSDT" or "BTCUSD_PERP"
  baseAsset: string;        // e.g. "BTC"
  quoteAsset: string;       // e.g. "USDT"
  displayName: string;      // e.g. "BTC/USDT"
  exchange: ExchangeId;
  productType: ProductType;
  pricePrecision: number;
  quantityPrecision: number;
  status: string;
  volume24h?: number;       // 24h quote volume
  lastPrice?: number;
  priceChangePercent24h?: number;
  isFavorite?: boolean;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  takerBuyBaseVolume?: number;
  takerBuyQuoteVolume?: number;
  trades?: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId?: number;
  timestamp: number;
}

export interface DerivativesData {
  fundingRate: number;      // e.g. 0.0001 (0.01%)
  nextFundingTime?: number;
  openInterest: number;     // contracts or coins
  openInterestValue?: number; // USD value
  longShortRatio?: number;  // e.g. 1.25 (1.25 longs per 1 short)
  longAccountRatio?: number;
  shortAccountRatio?: number;
}

export type FactorVote = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface FactorDetail {
  id: string;
  name: string;
  category: 
    | 'Trend' 
    | 'Momentum' 
    | 'Volatility' 
    | 'Volume' 
    | 'OrderBook' 
    | 'Derivatives' 
    | 'Structure' 
    | 'Sentiment';
  vote: FactorVote;
  score: number; // -100 to +100
  summary: string;
  metrics: { [key: string]: string | number };
}

export type SignalType = 'BUY' | 'SELL' | 'LONG' | 'SHORT' | 'WAIT' | 'NO_TRADE';

export interface SignalResult {
  id: string;
  timestamp: number;
  exchange: ExchangeId;
  symbol: string;
  displayName: string;
  timeframe: Timeframe;
  signal: SignalType;
  entryPrice: number;
  stopLoss: number;
  targetPrice1: number;
  targetPrice2: number;
  targetPrice3: number;
  riskRewardRatio: number;
  confidenceScore: number; // 0 - 100%
  source?: 'MANUAL' | 'AUTO';
  recommendedLeverage?: number;
  liquidationPrice?: number;
  reviewTime?: number;
  aiAnalysis?: string;
  factorsSummary: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    totalFactors: number;
    agreementRatio: number;
  };
  strategyName: string;
  strategyDescription: string;
  strictMode: boolean;
  reasons: string[];
  factors: FactorDetail[];
  klineSnapshot?: {
    lastClose: number;
    atr14: number;
    rsi14: number;
  };
}

export interface ScannedPairResult {
  pair: CryptoPair;
  signalResult: SignalResult;
  agreementScoreText: string; // e.g. "7/8 Factors (88% Agreement)"
  agreementRatio: number; // 0 to 1
  direction: 'LONG' | 'SHORT';
  entryZoneMin: number;
  entryZoneMax: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3?: number;
  riskRewardRatio: number;
  estimatedHoldingTime: string;
  factorsFor: string[];
  factorsAgainst: string[];
  spreadPercent: number;
  volume24h: number;
}

export interface TrackedTradeAlert {
  pairSymbol: string;
  direction: 'LONG' | 'SHORT';
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  entryTriggered: boolean;
  tp1Triggered: boolean;
  tp2Triggered: boolean;
  slTriggered: boolean;
  activatedAt: number;
  lastPrice?: number;
}

export type TradeTimeLimit = '5m' | '15m' | '30m' | '1h' | '4h' | 'custom';
export type VoiceLanguage = 'en-US' | 'hi-IN' | 'ur-PK';
export type WhatsAppDeliveryMode = 'quick_share' | 'automatic';

// --- AUTO SCANNER & 27-POINT SIGNAL TYPES ---
export type AutoScannerStatus = 'OFF' | 'COMMAND_READY' | 'SCANNING' | 'PAUSED' | 'CONTINUOUS';

export type AutoScannerCommand =
  | 'SCAN_ALL'
  | 'FIND_BEST_LONG'
  | 'FIND_BEST_SHORT'
  | 'FIND_BEST_OPPORTUNITY'
  | 'START_CONTINUOUS'
  | 'STOP'
  | 'PAUSE'
  | 'RESUME';

export interface FullSignal27Point {
  // 1. Exchange & Market
  exchange: ExchangeId;
  marketType?: MarketType;
  marketOptionId?: MarketOptionId;
  // 2. Trading Pair
  symbol: string;
  displayName: string;
  // 3. Direction
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT' | 'WAIT' | 'NO_TRADE';
  // 4. Current Live Price
  currentPrice: number;
  // 5. Suggested Entry Price
  entryPrice: number;
  // 6. Safe Entry Zone (Min - Max)
  entryZoneMin: number;
  entryZoneMax: number;
  // 7. Timeframe
  timeframe: Timeframe;
  // 8. Recommended Holding Period
  holdingPeriod: string;
  // 9. Recommended Leverage (1x to 100x)
  recommendedLeverage: number;
  userLeverage?: number;
  // 10. Stop Loss Price & % distance
  stopLoss: number;
  stopLossDistancePercent: number;
  // 11. Take Profit 1 Price & % distance
  takeProfit1: number;
  takeProfit1DistancePercent: number;
  // 12. Take Profit 2 Price & % distance
  takeProfit2: number;
  takeProfit2DistancePercent: number;
  // 13. Take Profit 3 Price & % distance
  takeProfit3: number;
  takeProfit3DistancePercent: number;
  // 14. Risk-to-Reward Ratio (R:R)
  riskRewardRatio: number;
  // 15. Overall Setup Score (0-100)
  setupScore: number;
  // 16. Signal Confidence % (0-100%)
  confidenceScore: number;
  // 17. Market Trend
  marketTrend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  // 18. RSI (14) value & condition
  rsiValue: number;
  rsiCondition: string;
  // 19. EMA Trend & Alignments (EMA 9, 21, 50, 100, 200)
  emaTrendDescription: string;
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  // 20. MACD Status (Value, Signal line, Histogram, Cross state)
  macdStatusDescription: string;
  macdValue: number;
  macdSignal: number;
  macdHist: number;
  // 21. Volume & 24h Activity
  volume24hUsd: number;
  volumeTrendDescription: string;
  // 22. Key Support & Resistance Levels
  supportLevel: number;
  resistanceLevel: number;
  // 23. Estimated Liquidation Price
  estimatedLiquidationPrice: number;
  liquidationBufferPercent: number;
  // 24. Funding Rate & Sentiment
  fundingRate: number;
  fundingRatePercentText: string;
  sentimentText: string;
  // 25. Signal Generation Timestamp
  generationTimestamp: number;
  generationTimeFormatted: string;
  // 26. Optimal Review / Expiry Time
  expiryTimestamp: number;
  expiryTimeFormatted: string;
  // 27. Detailed AI Market Analysis & Trade Plan
  aiMarketAnalysisNarrative: string;
  // Smart Money Snapshot
  smartMoneyData?: SmartMoneyData;
  // Metadata
  source: 'MANUAL' | 'AUTO';
  reasons: string[];
}

export interface AutoScannerStats {
  status: AutoScannerStatus;
  activeExchange: ExchangeId;
  totalTradablePairs: number;
  pairsScanned: number;
  scanProgressPercent: number;
  longSignalsCount: number;
  shortSignalsCount: number;
  waitCount: number;
  lastScanTime: number | null;
  nextScanCountdownSeconds: number;
  currentCommand: AutoScannerCommand | null;
  bestOpportunity: FullSignal27Point | null;
  scannedOpportunities: FullSignal27Point[];
}

// --- FINANCE & BUDGET MANAGEMENT TYPES ---
export interface FinanceBudgetData {
  startingBudgetUsd: number;
  currentCapitalUsd: number;
  availableBalanceUsd: number;
  allocatedMarginUsd: number;
  dailyPnlUsd: number;
  weeklyPnlUsd: number;
  monthlyPnlUsd: number;
  totalFeesPaidUsd: number;
  riskPerTradePercent: number; // default 1%
  maxDailyLossPercent: number; // default 3%
  isDailyLossLocked: boolean;
  selectedLeverage: number; // 1 to 100
}

export interface ActiveLiveTrade {
  id: string;
  symbol: string;
  displayName: string;
  exchange: ExchangeId;
  direction: 'LONG' | 'SHORT';
  entryZoneMin: number;
  entryZoneMax: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  timeframe: Timeframe;
  durationMinutes: number;
  startTime: number; // wall-clock Date.now()
  targetEndTime: number; // wall-clock Date.now() + duration
  status: 'PENDING_ENTRY' | 'ACTIVE' | 'EXPIRED' | 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'CLOSED';
  entryTouched: boolean;
  announced50Pct: boolean;
  announced5Min: boolean;
  last10sCounted: number; // tracking countdown seconds
  exitPrice?: number;
  pnlPercent?: number;
  resultType?: 'WIN' | 'LOSS' | 'DRAW';
  agreementScore: number;
  timeLimitLabel: string;
}

export interface WhatsAppLogEntry {
  id: string;
  timestamp: number;
  eventType: 'SIGNAL' | 'TRADE_TAKEN' | 'ENTRY_TOUCHED' | 'TP1' | 'TP2' | 'SL' | 'EXPIRED' | 'FINAL_RESULT';
  pair: string;
  recipient: string;
  mode: WhatsAppDeliveryMode;
  status: 'SENT' | 'PENDING' | 'FAILED';
  previewText: string;
  error?: string;
}

export interface WhatsAppRecipient {
  id: string;
  name: string;
  countryCode: string; // e.g. "+91"
  phone: string; // e.g. "9934480908"
  enabled: boolean;
}

export interface AutoModeSettings {
  enabled: boolean;
  intervalMinutes: 5 | 15 | 30 | 60;
  maxDailySignals: number; // default 10
  minMinutesBetweenSignals: number; // default 30
  samePairCooldownHours: number; // default 4
  quietHoursStart: number; // default 23 (23:00)
  quietHoursEnd: number; // default 7 (07:00)
  signalsSentToday: number;
  lastSignalTimestamp: number;
  lastSentByPair: Record<string, number>; // "BTCUSDT_LONG": timestamp
  lastScanTimestamp: number;
  nextScanTimestamp: number;
}

export interface PaperTradeRecord {
  id: string;
  signalId?: string;
  symbol: string;
  displayName: string;
  exchange: ExchangeId;
  timeframe: Timeframe;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  entryTime: number;
  exitTime: number;
  pnlPercent: number;
  pnlUsd: number;
  result: 'WIN' | 'LOSS' | 'DRAW';
  exitReason: 'TP1' | 'TP2' | 'SL' | 'TIME_EXPIRED' | 'MANUAL';
  feesPaidUsd: number;
  leverage: number;
}

export interface BacktestResult {
  pair: string;
  timeframe: Timeframe;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  drawCount: number;
  winRatePercent: number;
  totalPnlPercent: number;
  netPnlPercentAfterFees: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  averageTradePnlPercent: number;
  expectancyPercent: number;
  trades: Array<{
    entryTime: number;
    exitTime: number;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    grossPnlPercent: number;
    netPnlPercent: number;
    result: 'WIN' | 'LOSS' | 'DRAW';
    reason: string;
  }>;
}

export interface UserSettings {
  strictMode: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  voiceLanguage: VoiceLanguage;
  voiceVolume: number; // 0.0 to 1.0
  vibrationEnabled: boolean;
  minRiskReward: number; // e.g. 1.5 or 2.0
  includeNewsSentiment: boolean;
  newsApiKey?: string;
  activeExchange: ExchangeId;
  selectedMarketOption?: MarketOptionId;
  coinGlassApiKey?: string;
  defaultTimeframe: Timeframe;
  favorites: string[]; // array of symbol strings
  disclaimerAccepted: boolean;
  // Scanner liquidity pre-filters
  min24hVolumeUsd: number; // default $10,000,000
  maxSpreadPercent: number; // default 0.08%
  // Trade Time Limit & Pre-trade Warning
  selectedTimeLimit: TradeTimeLimit;
  customTimeLimitMinutes: number;
  preTradeCountdownSeconds: number; // default 15
  // WhatsApp settings & recipient list
  whatsappEnabled: boolean;
  whatsappPhone: string; // legacy fallback
  whatsappRecipients: WhatsAppRecipient[];
  whatsappMode: WhatsAppDeliveryMode; // 'quick_share' or 'automatic'
  sendToWhatsAppOnSelect: boolean;
  // Auto Mode
  autoMode: AutoModeSettings;
  // Risk & Paper Trading
  paperTradingEnabled: boolean;
  paperBalanceUsd: number;
  maxLeverage: number; // suggested 2x, cannot exceed 3x
  riskPerTradePercent: number; // default 1%, max 2%
  dailyLossLimitPercent: number; // default 3%
  dailyLossAccumulatedUsd: number;
  isDailyLossLocked: boolean;
  dailyLossLockedDate?: string; // YYYY-MM-DD
  isLiveModeSelected: boolean;
  // Event Calendar API & Checklist
  calendarApiKey?: string;
  firstUsageTimestamp?: number;
  dailyLossLimitBreaches?: number;
  consecutiveLossCount?: number;
  revengeCooldownUntil?: number; // 30-min lock after 2 consecutive losses
  dailyLossCooldownUntil?: number; // lock until next day
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number; // UTC epoch ms
  category: 'CENTRAL_BANK' | 'INFLATION' | 'EMPLOYMENT' | 'EARNINGS' | 'GDP' | 'OTHER';
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface PerformancePeriodReport {
  period: 'WEEKLY' | 'MONTHLY';
  startDate: number;
  endDate: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  drawCount: number;
  winRatePercent: number;
  totalPnlUsd: number;
  totalPnlPercent: number;
  averageWinUsd: number;
  averageLossUsd: number;
  averageWinPercent: number;
  averageLossPercent: number;
  expectancyUsd: number;
  expectancyPercent: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  bestPair: { name: string; pnlUsd: number; wins: number; total: number } | null;
  worstPair: { name: string; pnlUsd: number; losses: number; total: number } | null;
  bestTimeframe: { tf: string; pnlUsd: number } | null;
  worstTimeframe: { tf: string; pnlUsd: number } | null;
  hasEnoughData: boolean; // >= 30 trades
  chartPoints: Array<{ label: string; pnl: number; cumulative: number }>;
}



