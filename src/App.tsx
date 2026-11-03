/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ExchangeId, 
  MarketOptionId,
  MarketType,
  Timeframe, 
  CryptoPair, 
  ProductType, 
  SignalResult, 
  UserSettings, 
  DerivativesData, 
  OrderBookData,
  KlineData,
  ScannedPairResult,
  TrackedTradeAlert,
  TradeTimeLimit,
  ActiveLiveTrade,
  WhatsAppLogEntry,
  PaperTradeRecord,
  AutoModeSettings,
  WhatsAppRecipient,
  AutoScannerStatus,
  AutoScannerCommand,
  FullSignal27Point,
  AutoScannerStats,
  FinanceBudgetData,
  EconomicEvent
} from './types/crypto';
import { MarketOptionSelector } from './components/MarketOptionSelector';
import { SmartMoneyPanel } from './components/SmartMoneyPanel';
import { Header } from './components/Header';
import { LivePriceBar } from './components/LivePriceBar';
import { RadarGauge } from './components/RadarGauge';
import { SignalCard } from './components/SignalCard';
import { PairSelectorModal } from './components/PairSelectorModal';
import { FactorsBreakdownModal } from './components/FactorsBreakdownModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { DisclaimerModal } from './components/DisclaimerModal';
import { OfflineBanner } from './components/OfflineBanner';
import { ScannerResultsModal } from './components/ScannerResultsModal';
import { TrackedPairAlertBar } from './components/TrackedPairAlertBar';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { TimeLimitSelector } from './components/TimeLimitSelector';
import { ActiveTradesBoard } from './components/ActiveTradesBoard';
import { PreTradeWarningOverlay } from './components/PreTradeWarningOverlay';
import { AutoModeBar } from './components/AutoModeBar';
import { AutoScannerDashboard } from './components/AutoScannerDashboard';
import { FinanceBudgetDashboard } from './components/FinanceBudgetDashboard';
import { Signal27PointCard } from './components/Signal27PointCard';
import { EventCalendarModal } from './components/EventCalendarModal';
import { EventWarningBanner } from './components/EventWarningBanner';
import { PocketOptionView } from './components/PocketOptionView';
import { QuotexView } from './components/QuotexView';
import { CompoundingTradingDashboard } from './components/CompoundingTradingDashboard';
import { BuyerSellerPressureGauge } from './components/BuyerSellerPressureGauge';
import { MasterControlHeaderCard } from './components/MasterControlHeaderCard';
import { fetchEconomicEvents, checkHighImpactEventWindow } from './services/economicCalendar';
import { executeAutoScanAllPairs } from './services/autoScannerEngine';
import { 
  fetchBinancePairs, 
  fetchBinanceSpotPairs,
  fetchBinanceKlines, 
  fetchBinanceOrderBook, 
  fetchBinanceDerivatives, 
  connectBinanceWebSocket 
} from './services/api/binance';
import { 
  fetchBitgetPairs, 
  fetchBitgetSpotPairs,
  fetchBitgetKlines, 
  fetchBitgetOrderBook, 
  fetchBitgetDerivatives, 
  connectBitgetWebSocket 
} from './services/api/bitget';
import { fetchCryptoSentiment, SentimentData } from './services/api/news';
import { 
  getHigherTimeframes, 
  runComprehensiveAnalysis, 
  AnalysisInput 
} from './services/analysisEngine';
import { 
  initAudio, 
  setSoundMuted, 
  playRadarPing, 
  playLongSignalSound, 
  playShortSignalSound, 
  playNoTradeSound,
  playClickSound 
} from './services/audio';
import { 
  announceScanComplete, 
  announcePriceAlert, 
  announceTradeMilestone,
  announceCountdownDigit,
  announceTradeResult,
  announceTradeStart,
  announceBestOpportunity,
  announceBestDirectionalSignal,
  announceCommandReady,
  announceScannerStateChange,
  announceNoOpportunityFound,
  announceConfirmedSignal,
  announceMultiExchangeSignal,
  cancelOngoingSpeech,
  configureVoiceSettings,
  triggerHapticVibration 
} from './services/voice';
import { AndroidForegroundServiceGuideModal } from './components/AndroidForegroundServiceGuideModal';
import { 
  dispatchToEnabledRecipients,
  formatStandardWhatsAppMessage, 
  DEFAULT_WHATSAPP_RECIPIENTS 
} from './services/whatsapp';
import { 
  acquireWakeLock, 
  releaseWakeLock, 
  startKeepAliveAudio, 
  stopKeepAliveAudio, 
  updateMediaSessionState, 
  sendWebNotification 
} from './services/backgroundReliability';
import { getBundledFallbackPairs } from './config/fallbackPairs';
import { formatCryptoPrice } from './utils/formatters';

// Stock Module Imports
import { 
  AssetMode, 
  StockMarketId, 
  StockAsset, 
  StockSignalResult, 
  StockPaperTrade, 
  StockUserSettings 
} from './types/stocks';
import { STOCK_MARKETS, computeMarketStatus } from './config/marketHours';
import { STOCK_UNIVERSE } from './config/stockUniverse';
import { fetchMarketStocks } from './services/api/stocksApi';
import { analyzeStock } from './services/stockAnalysisEngine';
import { MarketHoursPanel } from './components/MarketHoursPanel';
import { StockSelectorModal } from './components/StockSelectorModal';
import { StockSignalCard } from './components/StockSignalCard';
import { StockScannerModal } from './components/StockScannerModal';
import { StockRiskCalculatorModal } from './components/StockRiskCalculatorModal';

const STORAGE_KEYS = {
  EXCHANGE: 'cyberpulse_exchange',
  PAIR: 'cyberpulse_selected_pair',
  TIMEFRAME: 'cyberpulse_timeframe',
  SETTINGS: 'cyberpulse_user_settings',
  HISTORY: 'cyberpulse_signal_history',
  DISCLAIMER: 'cyberpulse_disclaimer_accepted',
  FAVORITES: 'cyberpulse_favorites',
  TRACKED_ALERT: 'cyberpulse_tracked_alert',
  ACTIVE_TRADES: 'cyberpulse_active_trades',
  WHATSAPP_LOGS: 'cyberpulse_whatsapp_logs',
  PAPER_TRADES: 'cyberpulse_paper_trades',
  ASSET_MODE: 'cyberpulse_asset_mode',
  STOCK_MARKET: 'cyberpulse_stock_market',
  STOCK_SELECTED: 'cyberpulse_stock_selected',
  STOCK_FAVORITES: 'cyberpulse_stock_favorites',
  STOCK_SETTINGS: 'cyberpulse_stock_settings',
  STOCK_PAPER_TRADES: 'cyberpulse_stock_paper_trades',
};

function getTimeLimitDurationMinutes(limit: TradeTimeLimit, customMin = 15): number {
  switch (limit) {
    case '5m': return 5;
    case '15m': return 15;
    case '30m': return 30;
    case '1h': return 60;
    case '4h': return 240;
    case 'custom': return Math.max(1, customMin);
  }
}

function getTimeLimitLabel(limit: TradeTimeLimit, customMin = 15): string {
  switch (limit) {
    case '5m': return '5 min';
    case '15m': return '15 min';
    case '30m': return '30 min';
    case '1h': return '1 hour';
    case '4h': return '4 hours';
    case 'custom': return `${customMin} min`;
  }
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Asset Mode Switch: Crypto Futures vs Stocks
  const [assetMode, setAssetMode] = useState<AssetMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ASSET_MODE) as AssetMode) || 'crypto';
  });

  // Stock Market & Stock States
  const [stockMarket, setStockMarket] = useState<StockMarketId>(() => {
    return (localStorage.getItem(STORAGE_KEYS.STOCK_MARKET) as StockMarketId) || 'US';
  });

  const [stockUniverse, setStockUniverse] = useState<StockAsset[]>(() => {
    return STOCK_UNIVERSE['US'];
  });

  const [selectedStock, setSelectedStock] = useState<StockAsset | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_SELECTED);
      if (saved) return JSON.parse(saved);
    } catch {}
    return STOCK_UNIVERSE['US'][0] || null;
  });

  const [stockFavorites, setStockFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_FAVORITES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['NVDA', 'AAPL', 'TSLA', 'RELIANCE', 'TCS'];
  });

  const [stockSettings, setStockSettings] = useState<StockUserSettings>(() => {
    const defaults: StockUserSettings = {
      dataProvider: 'demo_bundled',
      apiKeyTwelveData: '',
      apiKeyFinnhub: '',
      apiKeyAlphaVantage: '',
      customYahooProxyUrl: '',
      enableShortSelling: false,
      observationPeriodMinutes: 15,
      customTradingWindowEnabled: false,
      customTradingStart: '10:00',
      customTradingEnd: '14:30',
      strictMode: true,
      virtualBalances: {
        US: 10000,
        NSE: 10000,
        LSE: 10000,
        TSE: 1000000,
        HKEX: 100000,
        XETRA: 10000,
        TSX: 10000,
        PSX: 100000
      },
      maxDailyLossPercent: 3,
      maxOpenTrades: 3,
      riskPerTradePercent: 1.0,
      coolDownMinutesAfterConsecutiveLosses: 30,
      lastTwoTradesLoss: false,
      consecutiveLossCount: 0
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_SETTINGS);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });

  const [stockSignal, setStockSignal] = useState<StockSignalResult | null>(null);
  const [stockPaperTrades, setStockPaperTrades] = useState<StockPaperTrade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_PAPER_TRADES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isStockSelectorOpen, setIsStockSelectorOpen] = useState(false);
  const [isStockScannerOpen, setIsStockScannerOpen] = useState(false);
  const [isStockCalculatorOpen, setIsStockCalculatorOpen] = useState(false);
  const [isScanningStocks, setIsScanningStocks] = useState(false);
  const [stockScanProgress, setStockScanProgress] = useState<{ current: number; total: number; currentTicker?: string }>({ current: 0, total: 0 });
  const [stockScannerResults, setStockScannerResults] = useState<StockSignalResult[]>([]);

  // Exchange & Market Option State (persisted in localStorage)
  const [selectedMarketOption, setSelectedMarketOption] = useState<MarketOptionId>(() => {
    return (localStorage.getItem('cyberpulse_market_option') as MarketOptionId) || 'BINANCE_FUTURES';
  });

  const [exchange, setExchange] = useState<ExchangeId>(() => {
    const savedOption = (localStorage.getItem('cyberpulse_market_option') as MarketOptionId) || 'BINANCE_FUTURES';
    return savedOption.startsWith('BINANCE') ? 'binance' : 'bitget';
  });

  const [activeProductType, setActiveProductType] = useState<ProductType>('USDT-M');
  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Timeframe & Trade Time Limit
  const [timeframe, setTimeframe] = useState<Timeframe>(() => {
    return (localStorage.getItem(STORAGE_KEYS.TIMEFRAME) as Timeframe) || '15m';
  });
  const [timeLimit, setTimeLimit] = useState<TradeTimeLimit>('15m');
  const [customTimeLimitMinutes, setCustomTimeLimitMinutes] = useState<number>(15);

  // Settings & Disclaimer (persisted in localStorage)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.DISCLAIMER) === 'true';
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    } catch {
      return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const defaults: UserSettings = {
      strictMode: true,
      soundEnabled: true,
      voiceEnabled: true,
      voiceLanguage: 'en-US',
      voiceVolume: 0.95,
      vibrationEnabled: true,
      minRiskReward: 2.0,
      includeNewsSentiment: true,
      activeExchange: 'binance',
      defaultTimeframe: '15m',
      favorites: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
      disclaimerAccepted: false,
      min24hVolumeUsd: 10_000_000,
      maxSpreadPercent: 0.08,
      selectedTimeLimit: '15m',
      customTimeLimitMinutes: 15,
      preTradeCountdownSeconds: 15,
      whatsappEnabled: true,
      whatsappPhone: '+919934480908',
      whatsappRecipients: DEFAULT_WHATSAPP_RECIPIENTS,
      whatsappMode: 'quick_share',
      sendToWhatsAppOnSelect: true,
      autoMode: {
        enabled: false,
        intervalMinutes: 15,
        maxDailySignals: 10,
        minMinutesBetweenSignals: 30,
        samePairCooldownHours: 4,
        quietHoursStart: 23,
        quietHoursEnd: 7,
        signalsSentToday: 0,
        lastSignalTimestamp: 0,
        lastSentByPair: {},
        lastScanTimestamp: 0,
        nextScanTimestamp: 0,
      },
      paperTradingEnabled: true,
      paperBalanceUsd: 10000,
      maxLeverage: 2, // strictly capped at 2x suggested, max 3x
      riskPerTradePercent: 1.0, // default 1%, max 2%
      dailyLossLimitPercent: 3, // default 3% locks signal generation
      dailyLossAccumulatedUsd: 0,
      isDailyLossLocked: false,
      isLiveModeSelected: false,
      calendarApiKey: '',
      firstUsageTimestamp: Date.now() - 32 * 24 * 3600 * 1000,
      dailyLossLimitBreaches: 0,
      consecutiveLossCount: 0,
      revengeCooldownUntil: 0,
      dailyLossCooldownUntil: 0,
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          firstUsageTimestamp: parsed.firstUsageTimestamp || defaults.firstUsageTimestamp,
          dailyLossLimitBreaches: parsed.dailyLossLimitBreaches ?? 0,
          consecutiveLossCount: parsed.consecutiveLossCount ?? 0,
          revengeCooldownUntil: parsed.revengeCooldownUntil ?? 0,
          dailyLossCooldownUntil: parsed.dailyLossCooldownUntil ?? 0,
        };
      }
    } catch {
      // fallback
    }
    return defaults;
  });

  // History State
  const [history, setHistory] = useState<SignalResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Paper Trades Journal State
  const [paperTrades, setPaperTrades] = useState<PaperTradeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAPER_TRADES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // WhatsApp Logs State
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tracked Alert State (active price monitoring)
  const [trackedAlert, setTrackedAlert] = useState<TrackedTradeAlert | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRACKED_ALERT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Live Trades with independent timers
  const [activeTrades, setActiveTrades] = useState<ActiveLiveTrade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRADES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live Market Data for Selected Pair
  const [livePrice, setLivePrice] = useState<number | undefined>(undefined);
  const [priceChange24h, setPriceChange24h] = useState<number | undefined>(undefined);
  const [high24h, setHigh24h] = useState<number | undefined>(undefined);
  const [low24h, setLow24h] = useState<number | undefined>(undefined);
  const [volume24h, setVolume24h] = useState<number | undefined>(undefined);
  const [derivatives, setDerivatives] = useState<DerivativesData | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [livePricesMap, setLivePricesMap] = useState<Record<string, number>>({});
  const [recentKlines, setRecentKlines] = useState<KlineData[]>([]);

  // Analysis & Scanner State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState('Initializing scan...');
  const [currentSignal, setCurrentSignal] = useState<SignalResult | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // Scanner Results Modal State
  const [topScannedPairs, setTopScannedPairs] = useState<ScannedPairResult[]>([]);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [totalScannedPoolCount, setTotalScannedPoolCount] = useState(0);

  // Pre-Trade Warning & Alarm Modal State
  const [isPreTradeWarningOpen, setIsPreTradeWarningOpen] = useState(false);
  const [preTradeTarget, setPreTradeTarget] = useState<{
    pair: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
  } | null>(null);

  // Risk Calculator Modal State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Auto Mode Countdown
  const [autoModeCountdownSecs, setAutoModeCountdownSecs] = useState<number>(15 * 60);

  // Economic Event Calendar State (Requirement 1)
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  // Regularly refresh calendar events & check ±30m window
  useEffect(() => {
    let mounted = true;
    const loadEvents = async () => {
      try {
        const evs = await fetchEconomicEvents(settings.calendarApiKey);
        if (mounted) setEconomicEvents(evs);
      } catch (e) {
        console.warn('Failed to load economic events:', e);
      }
    };
    loadEvents();
    const interval = setInterval(loadEvents, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [settings.calendarApiKey]);

  // Clock ticker for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEventWindow = checkHighImpactEventWindow(economicEvents, 30);

  // Non-Bypassable Cool-down Locks (Requirement 4)
  const isRevengeCooldownActive = Boolean(
    settings.revengeCooldownUntil && settings.revengeCooldownUntil > currentTimeMs
  );
  const revengeCooldownRemainingSecs = isRevengeCooldownActive
    ? Math.max(0, Math.ceil((settings.revengeCooldownUntil! - currentTimeMs) / 1000))
    : 0;

  const isDailyLossCooldownActive = Boolean(
    settings.dailyLossCooldownUntil && settings.dailyLossCooldownUntil > currentTimeMs
  );

  const isLocked = isRevengeCooldownActive || isDailyLossCooldownActive;
  const lockReason = isRevengeCooldownActive
    ? 'Take a break, do not revenge-trade'
    : isDailyLossCooldownActive
    ? 'Daily loss limit reached. Trading locked until tomorrow.'
    : undefined;

  const lockCountdownText = isRevengeCooldownActive
    ? `LOCK ${Math.floor(revengeCooldownRemainingSecs / 60)}m`
    : isDailyLossCooldownActive
    ? 'LOCKED 24H'
    : undefined;

  // Centralized Paper Trade Outcome & Safeguards Processor
  const recordPaperTradeOutcome = useCallback((journalEntry: PaperTradeRecord) => {
    setPaperTrades((prev) => [journalEntry, ...prev.slice(0, 199)]);

    setSettings((prev) => {
      const isLoss = journalEntry.result === 'LOSS';
      const isWin = journalEntry.result === 'WIN';

      // Cool-Down Rule 1: After 2 consecutive losses, lock Generate for 30 minutes
      const nextLossCount = isLoss
        ? (prev.consecutiveLossCount || 0) + 1
        : isWin
        ? 0
        : (prev.consecutiveLossCount || 0);

      const nextRevengeUntil = nextLossCount >= 2
        ? Date.now() + 30 * 60 * 1000
        : (prev.revengeCooldownUntil && prev.revengeCooldownUntil > Date.now() ? prev.revengeCooldownUntil : 0);

      const pnlUsd = journalEntry.pnlUsd || 0;
      const feesUsd = journalEntry.feesPaidUsd || 0;
      const newBal = Math.max(0, prev.paperBalanceUsd + pnlUsd - feesUsd);
      const newAccumLoss = pnlUsd < 0 ? prev.dailyLossAccumulatedUsd + Math.abs(pnlUsd) : prev.dailyLossAccumulatedUsd;
      const maxAllowedLoss = prev.paperBalanceUsd * (prev.dailyLossLimitPercent / 100);
      const hitDailyLimit = newAccumLoss >= maxAllowedLoss;

      // Cool-Down Rule 2: After daily loss limit, lock until next day (00:00 local time)
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const nextDailyLossCooldownUntil = hitDailyLimit ? endOfToday.getTime() : (prev.dailyLossCooldownUntil || 0);
      const nextBreaches = hitDailyLimit ? (prev.dailyLossLimitBreaches || 0) + 1 : (prev.dailyLossLimitBreaches || 0);

      return {
        ...prev,
        paperBalanceUsd: Math.round(newBal * 100) / 100,
        dailyLossAccumulatedUsd: newAccumLoss,
        isDailyLossLocked: hitDailyLimit,
        consecutiveLossCount: nextLossCount,
        revengeCooldownUntil: nextRevengeUntil,
        dailyLossCooldownUntil: nextDailyLossCooldownUntil,
        dailyLossLimitBreaches: nextBreaches,
      };
    });
  }, []);

  // Refs for tracking active state inside tick worker callbacks
  const activeTradesRef = useRef<ActiveLiveTrade[]>(activeTrades);
  useEffect(() => {
    activeTradesRef.current = activeTrades;
  }, [activeTrades]);

  const livePricesRef = useRef<Record<string, number>>(livePricesMap);
  useEffect(() => {
    livePricesRef.current = livePricesMap;
  }, [livePricesMap]);

  const settingsRef = useRef<UserSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Keep audio & voice preferences synced
  useEffect(() => {
    setSoundMuted(!settings.soundEnabled);
    configureVoiceSettings({
      enabled: settings.voiceEnabled !== false,
      language: settings.voiceLanguage || 'en-US',
      volume: settings.voiceVolume ?? 0.95,
      vibration: settings.vibrationEnabled !== false,
    });
  }, [settings.soundEnabled, settings.voiceEnabled, settings.voiceLanguage, settings.voiceVolume, settings.vibrationEnabled]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Persist history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  // Persist paper trades
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAPER_TRADES, JSON.stringify(paperTrades));
  }, [paperTrades]);

  // Persist WhatsApp logs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(whatsappLogs));
  }, [whatsappLogs]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Persist tracked alert
  useEffect(() => {
    if (trackedAlert) {
      localStorage.setItem(STORAGE_KEYS.TRACKED_ALERT, JSON.stringify(trackedAlert));
    } else {
      localStorage.removeItem(STORAGE_KEYS.TRACKED_ALERT);
    }
  }, [trackedAlert]);

  // Persist active trades
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRADES, JSON.stringify(activeTrades));
  }, [activeTrades]);

  // Persist Stocks Module States
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSET_MODE, assetMode);
  }, [assetMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_MARKET, stockMarket);
  }, [stockMarket]);

  useEffect(() => {
    if (selectedStock) {
      localStorage.setItem(STORAGE_KEYS.STOCK_SELECTED, JSON.stringify(selectedStock));
    }
  }, [selectedStock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_FAVORITES, JSON.stringify(stockFavorites));
  }, [stockFavorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_SETTINGS, JSON.stringify(stockSettings));
  }, [stockSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_PAPER_TRADES, JSON.stringify(stockPaperTrades));
  }, [stockPaperTrades]);

  // Load stocks when stockMarket changes
  useEffect(() => {
    let isCancelled = false;
    fetchMarketStocks(stockMarket, stockSettings).then(loaded => {
      if (!isCancelled) {
        setStockUniverse(loaded);
        if (!selectedStock || selectedStock.market !== stockMarket) {
          setSelectedStock(loaded[0] || null);
          setStockSignal(null);
        }
      }
    });
    return () => { isCancelled = true; };
  }, [stockMarket]);

  // Background Reliability: Wake Lock, Keep-Alive Audio & Media Session
  useEffect(() => {
    const activeRunningTrades = activeTrades.filter(
      (t) => t.status === 'ACTIVE' || t.status === 'PENDING_ENTRY'
    );

    if (activeRunningTrades.length > 0) {
      acquireWakeLock();
      startKeepAliveAudio();
      const topTrade = activeRunningTrades[0];
      updateMediaSessionState(
        activeRunningTrades.length,
        `${topTrade.displayName} • ${topTrade.direction}`
      );
    } else {
      releaseWakeLock();
      stopKeepAliveAudio();
      updateMediaSessionState(0);
    }
  }, [activeTrades]);

  // Helper to log and dispatch WhatsApp notifications to all enabled recipients
  const sendWhatsAppUpdate = useCallback(
    async (
      msgText: string,
      eventType: WhatsAppLogEntry['eventType'],
      pairSymbol: string
    ) => {
      const s = settingsRef.current;
      if (!s.whatsappEnabled) return;

      try {
        const recipients = s.whatsappRecipients && s.whatsappRecipients.length > 0
          ? s.whatsappRecipients
          : DEFAULT_WHATSAPP_RECIPIENTS;

        const logs = await dispatchToEnabledRecipients(
          msgText,
          eventType,
          pairSymbol,
          recipients,
          s.whatsappMode || 'quick_share'
        );
        if (logs.length > 0) {
          setWhatsappLogs((prev) => [...logs, ...prev.slice(0, 99)]);
        }
      } catch (err) {
        console.error('WhatsApp dispatch error:', err);
      }
    },
    []
  );

  // Dedicated Web Worker for Independent Wall-Clock Trade Timers
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('./workers/timerWorker.ts', import.meta.url), {
        type: 'module',
      });

      worker.postMessage({ command: 'start', intervalMs: 500 });

      worker.onmessage = (e: MessageEvent<{ type: string; now: number }>) => {
        if (e.data.type !== 'TICK') return;
        const now = e.data.now;

        // Auto Mode countdown check
        const s = settingsRef.current;
        if (s.autoMode?.enabled && s.autoMode.nextScanTimestamp) {
          const rem = Math.max(0, Math.ceil((s.autoMode.nextScanTimestamp - now) / 1000));
          setAutoModeCountdownSecs(rem);
        }

        const currentTrades = activeTradesRef.current;
        if (!currentTrades || currentTrades.length === 0) return;

        let hasMutated = false;
        const updatedTrades = currentTrades.map((trade) => {
          if (trade.status !== 'ACTIVE' && trade.status !== 'PENDING_ENTRY') {
            return trade;
          }

          const totalMs = trade.targetEndTime - trade.startTime;
          const remainingMs = trade.targetEndTime - now;
          const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
          const updated = { ...trade };

          // 1. Check 50% Milestone Announcement
          if (!updated.announced50Pct && remainingMs <= totalMs / 2 && remainingMs > 0) {
            updated.announced50Pct = true;
            hasMutated = true;
            const minsLeft = Math.ceil(remainingMs / 60000);
            announceTradeMilestone('50_PERCENT', updated.displayName, `${minsLeft}m`);
            sendWebNotification(`Halfway Mark: ${updated.displayName}`, {
              body: `50% of the trade limit has elapsed (${minsLeft}m remaining).`,
            });
          }

          // 2. Check 5 Minutes Left Milestone Announcement
          if (!updated.announced5Min && remainingMs <= 5 * 60 * 1000 && remainingMs > 0 && totalMs > 5 * 60 * 1000) {
            updated.announced5Min = true;
            hasMutated = true;
            announceTradeMilestone('5_MIN_LEFT', updated.displayName);
            sendWebNotification(`5 Minutes Left: ${updated.displayName}`, {
              body: `Holding limit expires in 5 minutes. Review or prepare to close.`,
            });
          }

          // 3. For limits <= 5 mins or remaining <= 10s: Speak countdown 10...1
          if (totalMs <= 5 * 60 * 1000 || remainingMs <= 10000) {
            if (remainingSecs <= 10 && remainingSecs >= 1 && remainingSecs < updated.last10sCounted) {
              updated.last10sCounted = remainingSecs;
              hasMutated = true;
              announceCountdownDigit(remainingSecs);
            }
          }

          // 4. Trade Expiry Check
          if (remainingMs <= 0) {
            hasMutated = true;
            const currentPrice = livePricesRef.current[updated.symbol] || updated.entryPrice;
            const isLong = updated.direction === 'LONG';
            const priceDiff = isLong ? currentPrice - updated.entryPrice : updated.entryPrice - currentPrice;
            const pnlPct = (priceDiff / updated.entryPrice) * 100;
            const resultType: 'WIN' | 'LOSS' | 'DRAW' = pnlPct > 0.05 ? 'WIN' : pnlPct < -0.05 ? 'LOSS' : 'DRAW';

            updated.status = 'EXPIRED';
            updated.exitPrice = currentPrice;
            updated.pnlPercent = pnlPct;
            updated.resultType = resultType;

            // Announce expiry and calculated P/L result
            announceTradeMilestone('EXPIRY', updated.displayName);
            setTimeout(() => {
              announceTradeResult(resultType, pnlPct);
            }, 1200);

            sendWebNotification(`Trade Limit Expired: ${updated.displayName}`, {
              body: `Result: ${resultType} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%). Entry $${updated.entryPrice} -> Exit $${currentPrice}.`,
            });

            // Dispatch WhatsApp expiry & final result
            const timeMsg = formatStandardWhatsAppMessage({
              exchange: updated.exchange,
              pair: updated.displayName,
              timeframe: updated.timeframe,
              direction: updated.direction,
              entryZone: `$${updated.entryZoneMin} - $${updated.entryZoneMax}`,
              stopLoss: updated.stopLoss,
              takeProfit1: updated.takeProfit1,
              takeProfit2: updated.takeProfit2,
              riskReward: 2.0,
              timeLimitLabel: updated.timeLimitLabel,
              agreementScore: updated.agreementScore,
              eventNote: `Time limit expired. Final result: ${resultType} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%). Exit $${currentPrice}.`,
            });
            sendWhatsAppUpdate(timeMsg, 'FINAL_RESULT', updated.displayName);

            // Record paper trade journal entry
            const feeRate = 0.001; // 0.05% entry + 0.05% exit
            const tradeSizeUsd = 1000;
            const pnlUsd = (tradeSizeUsd * (pnlPct / 100));
            const feesUsd = tradeSizeUsd * feeRate;

            const journalEntry: PaperTradeRecord = {
              id: `pt-${now}-${Math.random().toString(36).substring(2, 6)}`,
              symbol: updated.symbol,
              displayName: updated.displayName,
              exchange: updated.exchange,
              timeframe: updated.timeframe,
              direction: updated.direction,
              entryPrice: updated.entryPrice,
              exitPrice: currentPrice,
              stopLoss: updated.stopLoss,
              takeProfit1: updated.takeProfit1,
              takeProfit2: updated.takeProfit2,
              entryTime: updated.startTime,
              exitTime: now,
              pnlPercent: pnlPct,
              pnlUsd,
              result: resultType,
              exitReason: 'TIME_EXPIRED',
              feesPaidUsd: feesUsd,
              leverage: 2,
            };
            recordPaperTradeOutcome(journalEntry);
          }

          return updated;
        });

        if (hasMutated) {
          setActiveTrades(updatedTrades);
        }
      };
    } catch (err) {
      console.warn('Timer worker not supported or failed to initialize:', err);
    }

    return () => {
      if (worker) {
        worker.postMessage({ command: 'stop' });
        worker.terminate();
      }
    };
  }, [sendWhatsAppUpdate]);

  // Load Pairs on selectedMarketOption or Exchange change
  const loadPairs = useCallback(async () => {
    try {
      let loadedPairs: CryptoPair[] = [];
      if (selectedMarketOption === 'BINANCE_SPOT') {
        loadedPairs = await fetchBinanceSpotPairs();
      } else if (selectedMarketOption === 'BINANCE_FUTURES') {
        loadedPairs = await fetchBinancePairs('USDT-M');
      } else if (selectedMarketOption === 'BITGET_SPOT') {
        loadedPairs = await fetchBitgetSpotPairs();
      } else {
        loadedPairs = await fetchBitgetPairs('USDT-FUTURES');
      }

      if (loadedPairs.length === 0) {
        console.warn('Using bundled offline fallback pairs list');
        loadedPairs = getBundledFallbackPairs(exchange);
        setIsUsingFallback(true);
      } else {
        setIsUsingFallback(false);
      }

      setPairs(loadedPairs);

      const savedPairJson = localStorage.getItem(STORAGE_KEYS.PAIR);
      let matchedPair: CryptoPair | null = null;

      if (savedPairJson) {
        try {
          const parsed = JSON.parse(savedPairJson);
          if (parsed && parsed.exchange === exchange) {
            matchedPair = loadedPairs.find((p) => p.symbol === parsed.symbol) || null;
          }
        } catch {
          // ignore
        }
      }

      if (!matchedPair && loadedPairs.length > 0) {
        matchedPair = loadedPairs.find((p) => p.symbol.startsWith('BTC')) || loadedPairs[0];
      }

      if (matchedPair) {
        setSelectedPair(matchedPair);
        setLivePrice(matchedPair.lastPrice);
        setPriceChange24h(matchedPair.priceChangePercent24h);
        if (matchedPair.lastPrice) {
          setLivePricesMap((prev) => ({ ...prev, [matchedPair!.symbol]: matchedPair!.lastPrice! }));
        }
      }
    } catch (err) {
      console.error('Failed to load pairs from API, activating fallback:', err);
      const fallbackList = getBundledFallbackPairs(exchange);
      setPairs(fallbackList);
      setIsUsingFallback(true);
      if (fallbackList.length > 0) {
        setSelectedPair(fallbackList[0]);
      }
    }
  }, [selectedMarketOption, exchange]);

  useEffect(() => {
    loadPairs();
  }, [loadPairs]);

  // Load recent klines for selected pair for backtesting & indicators
  useEffect(() => {
    if (!selectedPair) return;
    const fetchKlines = async () => {
      try {
        const kl = selectedPair.exchange === 'binance'
          ? await fetchBinanceKlines(selectedPair.symbol, timeframe, 100)
          : await fetchBitgetKlines(selectedPair.symbol, timeframe, selectedPair.productType, 100);
        setRecentKlines(kl);
      } catch {
        // ignore
      }
    };
    fetchKlines();
  }, [selectedPair, timeframe]);

  // Handle Exchange Change
  const handleExchangeChange = (newExchange: ExchangeId) => {
    if (newExchange === exchange) return;
    setExchange(newExchange);
    localStorage.setItem(STORAGE_KEYS.EXCHANGE, newExchange);
    setActiveProductType(newExchange === 'binance' ? 'USDT-M' : 'USDT-FUTURES');
    setLivePrice(undefined);
    setDerivatives(null);
  };

  // Handle Pair Selection
  const handleSelectPair = (pair: CryptoPair) => {
    setSelectedPair(pair);
    setLivePrice(pair.lastPrice);
    setPriceChange24h(pair.priceChangePercent24h);
    if (pair.lastPrice) {
      setLivePricesMap((prev) => ({ ...prev, [pair.symbol]: pair.lastPrice! }));
    }
    localStorage.setItem(STORAGE_KEYS.PAIR, JSON.stringify(pair));
  };

  // Handle Timeframe Change
  const handleTimeframeChange = (newTf: Timeframe) => {
    setTimeframe(newTf);
    localStorage.setItem(STORAGE_KEYS.TIMEFRAME, newTf);
  };

  // Handle Holding Time Limit Change
  const handleSelectTimeLimit = (limit: TradeTimeLimit, customMin?: number) => {
    setTimeLimit(limit);
    if (customMin) {
      setCustomTimeLimitMinutes(customMin);
    }
    if (limit === '5m') handleTimeframeChange('5m');
    else if (limit === '15m') handleTimeframeChange('15m');
    else if (limit === '30m') handleTimeframeChange('30m');
    else if (limit === '1h') handleTimeframeChange('1h');
    else if (limit === '4h') handleTimeframeChange('4h');
  };

  // Handle Favorites toggle
  const handleToggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  // Live WebSocket & Alert Tracking for Selected Pair
  useEffect(() => {
    if (!selectedPair) return;

    let cleanupWs: (() => void) | undefined;
    let isCancelled = false;

    const loadDerivatives = async () => {
      try {
        if (selectedPair.exchange === 'binance') {
          const deriv = await fetchBinanceDerivatives(selectedPair.symbol);
          if (!isCancelled) setDerivatives(deriv);
        } else {
          const deriv = await fetchBitgetDerivatives(selectedPair.symbol, selectedPair.productType);
          if (!isCancelled) setDerivatives(deriv);
        }
      } catch {
        // fallback
      }
    };
    loadDerivatives();

    const handleTickerUpdate = (price: number, change: number, high: number, low: number, vol: number) => {
      if (isCancelled) return;
      setWsConnected(true);
      setLivePrice(price);
      setPriceChange24h(change);
      setHigh24h(high);
      setLow24h(low);
      setVolume24h(vol);
      setLivePricesMap((prev) => ({ ...prev, [selectedPair.symbol]: price }));

      // Evaluate active trades against this live price
      setActiveTrades((trades) => {
        let tradeChanged = false;
        const mapped = trades.map((t) => {
          if (
            t.symbol !== selectedPair.symbol ||
            t.status === 'EXPIRED' ||
            t.status === 'CLOSED' ||
            t.status === 'TP2_HIT' ||
            t.status === 'SL_HIT'
          ) {
            return t;
          }

          const isLong = t.direction === 'LONG';
          const updated = { ...t };

          // Check Entry zone touch
          if (!updated.entryTouched) {
            const inZone = price >= Math.min(t.entryZoneMin, t.entryZoneMax) && price <= Math.max(t.entryZoneMin, t.entryZoneMax);
            if (inZone) {
              updated.entryTouched = true;
              updated.status = 'ACTIVE';
              tradeChanged = true;
              announcePriceAlert('entry', t.displayName, price);
              const entryMsg = formatStandardWhatsAppMessage({
                exchange: t.exchange,
                pair: t.displayName,
                timeframe: t.timeframe,
                direction: t.direction,
                entryZone: `$${formatCryptoPrice(t.entryZoneMin)} - $${formatCryptoPrice(t.entryZoneMax)}`,
                stopLoss: t.stopLoss,
                takeProfit1: t.takeProfit1,
                takeProfit2: t.takeProfit2,
                riskReward: 2.0,
                timeLimitLabel: t.timeLimitLabel,
                agreementScore: t.agreementScore,
                eventNote: `Entry zone touched at $${formatCryptoPrice(price)}. Trade order executing.`,
              });
              sendWhatsAppUpdate(entryMsg, 'ENTRY_TOUCHED', t.displayName);
            }
          }

          // Check Take Profit 1
          if (t.status === 'ACTIVE' && (isLong ? price >= t.takeProfit1 : price <= t.takeProfit1)) {
            updated.status = 'TP1_HIT';
            tradeChanged = true;
            announcePriceAlert('tp1', t.displayName, price);
            const tp1Msg = formatStandardWhatsAppMessage({
              exchange: t.exchange,
              pair: t.displayName,
              timeframe: t.timeframe,
              direction: t.direction,
              entryZone: `$${formatCryptoPrice(t.entryZoneMin)} - $${formatCryptoPrice(t.entryZoneMax)}`,
              stopLoss: t.stopLoss,
              takeProfit1: t.takeProfit1,
              takeProfit2: t.takeProfit2,
              riskReward: 2.0,
              timeLimitLabel: t.timeLimitLabel,
              agreementScore: t.agreementScore,
              eventNote: `Take Profit 1 hit at $${formatCryptoPrice(price)}! Secure partial profit.`,
            });
            sendWhatsAppUpdate(tp1Msg, 'TP1', t.displayName);
          }

          // Check Take Profit 2
          if (t.status === 'TP1_HIT' && (isLong ? price >= t.takeProfit2 : price <= t.takeProfit2)) {
            const pnl = isLong ? ((price - t.entryPrice) / t.entryPrice) * 100 : ((t.entryPrice - price) / t.entryPrice) * 100;
            updated.status = 'TP2_HIT';
            updated.exitPrice = price;
            updated.pnlPercent = pnl;
            updated.resultType = 'WIN';
            tradeChanged = true;
            announcePriceAlert('tp2', t.displayName, price);
            announceTradeResult('WIN', pnl);
            const tp2Msg = formatStandardWhatsAppMessage({
              exchange: t.exchange,
              pair: t.displayName,
              timeframe: t.timeframe,
              direction: t.direction,
              entryZone: `$${formatCryptoPrice(t.entryZoneMin)} - $${formatCryptoPrice(t.entryZoneMax)}`,
              stopLoss: t.stopLoss,
              takeProfit1: t.takeProfit1,
              takeProfit2: t.takeProfit2,
              riskReward: 2.0,
              timeLimitLabel: t.timeLimitLabel,
              agreementScore: t.agreementScore,
              eventNote: `Take Profit 2 hit at $${formatCryptoPrice(price)}! Full target hit. Win: +${pnl.toFixed(2)}%.`,
            });
            sendWhatsAppUpdate(tp2Msg, 'FINAL_RESULT', t.displayName);

            // Record paper trade
            recordPaperTradeOutcome({
              id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              symbol: t.symbol,
              displayName: t.displayName,
              exchange: t.exchange,
              timeframe: t.timeframe,
              direction: t.direction,
              entryPrice: t.entryPrice,
              exitPrice: price,
              stopLoss: t.stopLoss,
              takeProfit1: t.takeProfit1,
              takeProfit2: t.takeProfit2,
              entryTime: t.startTime,
              exitTime: Date.now(),
              pnlPercent: pnl,
              pnlUsd: 1000 * (pnl / 100),
              result: 'WIN',
              exitReason: 'TP2',
              feesPaidUsd: 1.0,
              leverage: 2,
            });
          }

          // Check Stop Loss
          if (t.status === 'ACTIVE' && (isLong ? price <= t.stopLoss : price >= t.stopLoss)) {
            const pnl = isLong ? ((price - t.entryPrice) / t.entryPrice) * 100 : ((t.entryPrice - price) / t.entryPrice) * 100;
            updated.status = 'SL_HIT';
            updated.exitPrice = price;
            updated.pnlPercent = pnl;
            updated.resultType = 'LOSS';
            tradeChanged = true;
            announcePriceAlert('sl', t.displayName, price);
            announceTradeResult('LOSS', pnl);
            const slMsg = formatStandardWhatsAppMessage({
              exchange: t.exchange,
              pair: t.displayName,
              timeframe: t.timeframe,
              direction: t.direction,
              entryZone: `$${formatCryptoPrice(t.entryZoneMin)} - $${formatCryptoPrice(t.entryZoneMax)}`,
              stopLoss: t.stopLoss,
              takeProfit1: t.takeProfit1,
              takeProfit2: t.takeProfit2,
              riskReward: 2.0,
              timeLimitLabel: t.timeLimitLabel,
              agreementScore: t.agreementScore,
              eventNote: `Stop Loss triggered at $${formatCryptoPrice(price)}. Trade protected. Loss: ${pnl.toFixed(2)}%.`,
            });
            sendWhatsAppUpdate(slMsg, 'SL', t.displayName);

            // Record paper trade
            recordPaperTradeOutcome({
              id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              symbol: t.symbol,
              displayName: t.displayName,
              exchange: t.exchange,
              timeframe: t.timeframe,
              direction: t.direction,
              entryPrice: t.entryPrice,
              exitPrice: price,
              stopLoss: t.stopLoss,
              takeProfit1: t.takeProfit1,
              takeProfit2: t.takeProfit2,
              entryTime: t.startTime,
              exitTime: Date.now(),
              pnlPercent: pnl,
              pnlUsd: 1000 * (pnl / 100),
              result: 'LOSS',
              exitReason: 'SL',
              feesPaidUsd: 1.0,
              leverage: 2,
            });
          }

          return updated;
        });

        return tradeChanged ? mapped : trades;
      });

      // Check Real-Time Price Alerts if this pair is currently tracked
      setTrackedAlert((currentTracked) => {
        if (!currentTracked || currentTracked.pairSymbol !== selectedPair.symbol) {
          return currentTracked;
        }

        const updated = { ...currentTracked, lastPrice: price };
        const isLong = updated.direction === 'LONG';

        if (!updated.entryTriggered) {
          const inZone = price >= Math.min(updated.entryMin, updated.entryMax) && price <= Math.max(updated.entryMin, updated.entryMax);
          if (inZone) {
            updated.entryTriggered = true;
            announcePriceAlert('entry', selectedPair.displayName, price);
          }
        }

        if (!updated.tp1Triggered) {
          const hit = isLong ? price >= updated.takeProfit1 : price <= updated.takeProfit1;
          if (hit) {
            updated.tp1Triggered = true;
            announcePriceAlert('tp1', selectedPair.displayName, price);
          }
        }

        if (!updated.tp2Triggered) {
          const hit = isLong ? price >= updated.takeProfit2 : price <= updated.takeProfit2;
          if (hit) {
            updated.tp2Triggered = true;
            announcePriceAlert('tp2', selectedPair.displayName, price);
          }
        }

        if (!updated.slTriggered) {
          const hit = isLong ? price <= updated.stopLoss : price >= updated.stopLoss;
          if (hit) {
            updated.slTriggered = true;
            announcePriceAlert('sl', selectedPair.displayName, price);
          }
        }

        return updated;
      });
    };

    try {
      if (selectedPair.exchange === 'binance') {
        cleanupWs = connectBinanceWebSocket(selectedPair.symbol, {
          onTicker: (d) => handleTickerUpdate(d.price, d.change24h, d.high24h, d.low24h, d.volume24h),
          onError: () => {
            if (!isCancelled) setWsConnected(false);
          },
        });
      } else {
        cleanupWs = connectBitgetWebSocket(selectedPair.symbol, selectedPair.productType, {
          onTicker: (d) => handleTickerUpdate(d.price, d.change24h, d.high24h, d.low24h, d.volume24h),
          onError: () => {
            if (!isCancelled) setWsConnected(false);
          },
        });
      }
    } catch {
      setWsConnected(false);
    }

    return () => {
      isCancelled = true;
      if (cleanupWs) cleanupWs();
      setWsConnected(false);
    };
  }, [selectedPair, sendWhatsAppUpdate]);

  // MARKET SCANNER: Triggers when user taps center "Generate Signal" button
  const handleGenerateSignal = async () => {
    if (isAnalyzing || !selectedPair) return;

    // Check cool-down locks (non-bypassable)
    if (isLocked) {
      alert(lockReason || 'Trading is temporarily locked by cool-down rules.');
      return;
    }

    // Check high-impact economic event window (±30 minutes)
    if (activeEventWindow.isEventActive) {
      initAudio();
      playNoTradeSound();
      const eventTitle = activeEventWindow.activeEvent?.title || 'Economic Event';
      const waitNotice = `High-impact economic event active (${eventTitle}). ±30m protection window: returning WAIT instead of directional signal.`;
      const noTradeSig: SignalResult = {
        id: `sig-${Date.now()}`,
        exchange,
        symbol: selectedPair.symbol,
        displayName: selectedPair.displayName,
        timeframe,
        timestamp: Date.now(),
        signal: 'NO_TRADE',
        entryPrice: livePrice || selectedPair.lastPrice || 0,
        stopLoss: 0,
        targetPrice1: 0,
        targetPrice2: 0,
        targetPrice3: 0,
        riskRewardRatio: 0,
        confidenceScore: 0,
        factorsSummary: {
          bullishCount: 0,
          bearishCount: 0,
          neutralCount: 8,
          totalFactors: 8,
          agreementRatio: 0,
        },
        strategyName: 'Event Window Protection',
        strategyDescription: 'Trading halted within ±30m of high-impact economic events',
        strictMode: settings.strictMode,
        factors: [],
        reasons: [waitNotice],
      };
      setCurrentSignal(noTradeSig);
      setHistory((prev) => [noTradeSig, ...prev.slice(0, 49)]);
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
      return;
    }

    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }

    initAudio();
    playRadarPing();
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisPhase('Initiating Market Scanner across all tradable perpetuals...');

    try {
      const minVolume = settings.min24hVolumeUsd || 10_000_000;
      const maxSpread = settings.maxSpreadPercent || 0.08;

      const liquidPairs = pairs
        .filter((p) => (p.volume24h || 0) >= minVolume)
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

      const scanCandidates = liquidPairs.length >= 8 ? liquidPairs.slice(0, 36) : pairs.slice(0, 24);
      setTotalScannedPoolCount(scanCandidates.length);

      const [htf1, htf2] = getHigherTimeframes(timeframe);

      const sentiment: SentimentData = await fetchCryptoSentiment(
        settings.newsApiKey || localStorage.getItem('cyberpulse_cp_key') || undefined
      ).catch(() => ({
        score: 0,
        label: 'Neutral',
        fearAndGreedValue: 50,
        fearAndGreedClassification: 'Neutral',
        headlines: [],
      }));

      const scannedResults: ScannedPairResult[] = [];
      const BATCH_SIZE = 4;

      for (let i = 0; i < scanCandidates.length; i += BATCH_SIZE) {
        const batch = scanCandidates.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (candidatePair, idx) => {
            const currentNum = i + idx + 1;
            const progressPercent = Math.min(95, Math.round((currentNum / scanCandidates.length) * 90) + 5);
            setAnalysisProgress(progressPercent);
            setAnalysisPhase(`Scanning ${currentNum} of ${scanCandidates.length} pairs (${candidatePair.displayName})...`);

            try {
              const [baseKlines, htf1Klines, htf2Klines, orderBook, rawDeriv] = await Promise.all([
                candidatePair.exchange === 'binance'
                  ? fetchBinanceKlines(candidatePair.symbol, timeframe, 80).catch(() => [] as KlineData[])
                  : fetchBitgetKlines(candidatePair.symbol, timeframe, candidatePair.productType, 80).catch(() => [] as KlineData[]),
                candidatePair.exchange === 'binance'
                  ? fetchBinanceKlines(candidatePair.symbol, htf1, 80).catch(() => [] as KlineData[])
                  : fetchBitgetKlines(candidatePair.symbol, htf1, candidatePair.productType, 80).catch(() => [] as KlineData[]),
                candidatePair.exchange === 'binance'
                  ? fetchBinanceKlines(candidatePair.symbol, htf2, 80).catch(() => [] as KlineData[])
                  : fetchBitgetKlines(candidatePair.symbol, htf2, candidatePair.productType, 80).catch(() => [] as KlineData[]),
                candidatePair.exchange === 'binance'
                  ? fetchBinanceOrderBook(candidatePair.symbol, 20).catch(() => ({ bids: [], asks: [], timestamp: Date.now() } as OrderBookData))
                  : fetchBitgetOrderBook(candidatePair.symbol, candidatePair.productType, 20).catch(() => ({ bids: [], asks: [], timestamp: Date.now() } as OrderBookData)),
                candidatePair.exchange === 'binance'
                  ? fetchBinanceDerivatives(candidatePair.symbol).catch(() => ({ fundingRate: 0.0001, openInterest: 0 } as DerivativesData))
                  : fetchBitgetDerivatives(candidatePair.symbol, candidatePair.productType).catch(() => ({ fundingRate: 0.0001, openInterest: 0 } as DerivativesData)),
              ]);

              if (baseKlines.length < 20) return;

              let spreadPct = 0.02;
              const bestBid = orderBook.bids[0]?.price;
              const bestAsk = orderBook.asks[0]?.price;
              if (bestBid && bestAsk && bestAsk > bestBid) {
                const mid = (bestBid + bestAsk) / 2;
                spreadPct = ((bestAsk - bestBid) / mid) * 100;
                if (spreadPct > maxSpread) return;
              }

              const analysisInput: AnalysisInput = {
                pair: candidatePair,
                timeframe,
                baseKlines,
                htf1Klines: htf1Klines.length > 0 ? htf1Klines : baseKlines,
                htf2Klines: htf2Klines.length > 0 ? htf2Klines : baseKlines,
                orderBook,
                derivatives: rawDeriv,
                sentiment,
                settings,
              };

              const signal = runComprehensiveAnalysis(analysisInput);

              if (signal.signal === 'LONG' || signal.signal === 'SHORT') {
                const currentPrice = signal.entryPrice;
                const atr = signal.klineSnapshot?.atr14 || currentPrice * 0.01;
                const buffer = atr * 0.25;

                const entryZoneMin = signal.signal === 'LONG' ? currentPrice - buffer : currentPrice;
                const entryZoneMax = signal.signal === 'LONG' ? currentPrice : currentPrice + buffer;

                const agreeingVote = signal.signal === 'LONG' ? 'BULLISH' : 'BEARISH';
                const opposingVote = signal.signal === 'LONG' ? 'BEARISH' : 'BULLISH';
                const factorsFor: string[] = [];
                const factorsAgainst: string[] = [];

                signal.factors.forEach((f) => {
                  if (f.vote === agreeingVote) {
                    factorsFor.push(f.category);
                  } else if (f.vote === opposingVote) {
                    factorsAgainst.push(f.category);
                  }
                });

                const agreementCount = signal.signal === 'LONG'
                  ? signal.factorsSummary.bullishCount
                  : signal.factorsSummary.bearishCount;
                const agreementRatio = agreementCount / 8;
                const agreementScoreText = `${agreementCount}/8 Factors (${Math.round(agreementRatio * 100)}% Agreement)`;

                scannedResults.push({
                  pair: candidatePair,
                  signalResult: signal,
                  agreementScoreText,
                  agreementRatio,
                  direction: signal.signal,
                  entryZoneMin,
                  entryZoneMax,
                  stopLoss: signal.stopLoss,
                  takeProfit1: signal.targetPrice1,
                  takeProfit2: signal.targetPrice2,
                  riskRewardRatio: signal.riskRewardRatio,
                  estimatedHoldingTime: getTimeLimitLabel(timeLimit, customTimeLimitMinutes),
                  factorsFor,
                  factorsAgainst,
                  spreadPercent: spreadPct,
                  volume24h: candidatePair.volume24h || 0,
                });
              }
            } catch {
              // ignore
            }
          })
        );

        if (i + BATCH_SIZE < scanCandidates.length) {
          await new Promise((r) => setTimeout(r, 70));
        }
      }

      const ranked = scannedResults.sort((a, b) => {
        if (b.agreementRatio !== a.agreementRatio) {
          return b.agreementRatio - a.agreementRatio;
        }
        return (b.volume24h || 0) - (a.volume24h || 0);
      });

      setAnalysisProgress(100);
      setAnalysisPhase('Market Scan Complete!');
      await new Promise((r) => setTimeout(r, 200));

      setTopScannedPairs(ranked);
      setIsScannerModalOpen(true);

      if (ranked.length > 0) {
        const top = ranked[0];
        announceScanComplete(top.pair.displayName, top.direction, top.signalResult.entryPrice);
        
        if (top.direction === 'LONG') {
          playLongSignalSound();
        } else {
          playShortSignalSound();
        }

        setPreTradeTarget({
          pair: top.pair.displayName,
          direction: top.direction,
          entryPrice: top.signalResult.entryPrice,
        });
        setIsPreTradeWarningOpen(true);
      } else {
        playNoTradeSound();
      }
    } catch (err) {
      console.error('Market scan error:', err);
      playNoTradeSound();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User taps one pair from the Top 5 to select it
  const handleSelectScannedPair = (item: ScannedPairResult) => {
    playClickSound();
    setSelectedPair(item.pair);
    setLivePrice(item.signalResult.entryPrice);
    setLivePricesMap((prev) => ({ ...prev, [item.pair.symbol]: item.signalResult.entryPrice }));
    localStorage.setItem(STORAGE_KEYS.PAIR, JSON.stringify(item.pair));

    setCurrentSignal(item.signalResult);
    setHistory((prev) => [item.signalResult, ...prev.slice(0, 49)]);

    const alert: TrackedTradeAlert = {
      pairSymbol: item.pair.symbol,
      direction: item.direction,
      entryMin: item.entryZoneMin,
      entryMax: item.entryZoneMax,
      stopLoss: item.stopLoss,
      takeProfit1: item.takeProfit1,
      takeProfit2: item.takeProfit2,
      entryTriggered: false,
      tp1Triggered: false,
      tp2Triggered: false,
      slTriggered: false,
      activatedAt: Date.now(),
      lastPrice: item.signalResult.entryPrice,
    };
    setTrackedAlert(alert);

    if (settings.sendToWhatsAppOnSelect) {
      const msg = formatStandardWhatsAppMessage({
        exchange: item.pair.exchange,
        pair: item.pair.displayName,
        timeframe: item.signalResult.timeframe,
        direction: item.direction,
        entryZone: `$${formatCryptoPrice(item.entryZoneMin)} - $${formatCryptoPrice(item.entryZoneMax)}`,
        stopLoss: item.stopLoss,
        takeProfit1: item.takeProfit1,
        takeProfit2: item.takeProfit2,
        riskReward: item.riskRewardRatio,
        timeLimitLabel: getTimeLimitLabel(timeLimit, customTimeLimitMinutes),
        agreementScore: item.agreementRatio * 100,
        eventNote: 'Pair selected from Top Scanner setups.',
      });
      sendWhatsAppUpdate(msg, 'SIGNAL', item.pair.displayName);
    }

    setPreTradeTarget({
      pair: item.pair.displayName,
      direction: item.direction,
      entryPrice: item.signalResult.entryPrice,
    });
    setIsPreTradeWarningOpen(true);
    setIsScannerModalOpen(false);
  };

  // User taps "I took this trade" on SignalCard
  const handleTakeTrade = () => {
    if (!currentSignal || currentSignal.signal === 'NO_TRADE') return;

    playClickSound();
    const durationMin = getTimeLimitDurationMinutes(timeLimit, customTimeLimitMinutes);
    const now = Date.now();
    const limitLabel = getTimeLimitLabel(timeLimit, customTimeLimitMinutes);

    const atr = currentSignal.klineSnapshot?.atr14 || currentSignal.entryPrice * 0.01;
    const buffer = atr * 0.25;
    const entryMin = currentSignal.signal === 'LONG' ? currentSignal.entryPrice - buffer : currentSignal.entryPrice;
    const entryMax = currentSignal.signal === 'LONG' ? currentSignal.entryPrice : currentSignal.entryPrice + buffer;
    const agreementScore = (currentSignal.factorsSummary.agreementRatio || 0.8) * 100;

    const newTrade: ActiveLiveTrade = {
      id: `trade-${now}-${Math.random().toString(36).substring(2, 7)}`,
      symbol: currentSignal.symbol,
      displayName: currentSignal.displayName,
      exchange: currentSignal.exchange,
      direction: currentSignal.signal === 'LONG' ? 'LONG' : 'SHORT',
      entryZoneMin: entryMin,
      entryZoneMax: entryMax,
      entryPrice: currentSignal.entryPrice,
      stopLoss: currentSignal.stopLoss,
      takeProfit1: currentSignal.targetPrice1,
      takeProfit2: currentSignal.targetPrice2,
      timeframe: currentSignal.timeframe,
      durationMinutes: durationMin,
      startTime: now,
      targetEndTime: now + durationMin * 60 * 1000,
      status: 'ACTIVE',
      entryTouched: true,
      announced50Pct: false,
      announced5Min: false,
      last10sCounted: 11,
      agreementScore,
      timeLimitLabel: limitLabel,
    };

    setActiveTrades((prev) => [newTrade, ...prev]);

    const msg = formatStandardWhatsAppMessage({
      exchange: currentSignal.exchange,
      pair: currentSignal.displayName,
      timeframe: currentSignal.timeframe,
      direction: newTrade.direction,
      entryZone: `$${formatCryptoPrice(entryMin)} - $${formatCryptoPrice(entryMax)}`,
      stopLoss: currentSignal.stopLoss,
      takeProfit1: currentSignal.targetPrice1,
      takeProfit2: currentSignal.targetPrice2,
      riskReward: currentSignal.riskRewardRatio,
      timeLimitLabel: limitLabel,
      agreementScore,
      eventNote: `Trade executed on exchange. Timer active for ${limitLabel}.`,
    });
    sendWhatsAppUpdate(msg, 'TRADE_TAKEN', currentSignal.displayName);

    acquireWakeLock();
    startKeepAliveAudio();
    sendWebNotification(`Trade Active: ${currentSignal.displayName}`, {
      body: `Holding limit: ${limitLabel}. Wall-clock timer started.`,
    });
    triggerHapticVibration([200, 100, 200]);
  };

  // Close an active trade manually
  const handleCloseActiveTrade = (tradeId: string) => {
    playClickSound();
    setActiveTrades((prev) =>
      prev.map((t) => {
        if (t.id !== tradeId) return t;

        const currentPrice = livePricesMap[t.symbol] || t.entryPrice;
        const isLong = t.direction === 'LONG';
        const priceDiff = isLong ? currentPrice - t.entryPrice : t.entryPrice - currentPrice;
        const pnlPct = (priceDiff / t.entryPrice) * 100;
        const resultType: 'WIN' | 'LOSS' | 'DRAW' = pnlPct > 0.05 ? 'WIN' : pnlPct < -0.05 ? 'LOSS' : 'DRAW';

        announceTradeResult(resultType, pnlPct);

        const closeMsg = formatStandardWhatsAppMessage({
          exchange: t.exchange,
          pair: t.displayName,
          timeframe: t.timeframe,
          direction: t.direction,
          entryZone: `$${formatCryptoPrice(t.entryZoneMin)} - $${formatCryptoPrice(t.entryZoneMax)}`,
          stopLoss: t.stopLoss,
          takeProfit1: t.takeProfit1,
          takeProfit2: t.takeProfit2,
          riskReward: 2.0,
          timeLimitLabel: t.timeLimitLabel,
          agreementScore: t.agreementScore,
          eventNote: `Trade manually closed. Result: ${resultType} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%). Exit $${formatCryptoPrice(currentPrice)}.`,
        });
        sendWhatsAppUpdate(closeMsg, 'FINAL_RESULT', t.displayName);

        // Record in paper trades journal
        recordPaperTradeOutcome({
          id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          symbol: t.symbol,
          displayName: t.displayName,
          exchange: t.exchange,
          timeframe: t.timeframe,
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: currentPrice,
          stopLoss: t.stopLoss,
          takeProfit1: t.takeProfit1,
          takeProfit2: t.takeProfit2,
          entryTime: t.startTime,
          exitTime: Date.now(),
          pnlPercent: pnlPct,
          pnlUsd: 1000 * (pnlPct / 100),
          result: resultType,
          exitReason: 'MANUAL',
          feesPaidUsd: 1.0,
          leverage: 2,
        });

        return {
          ...t,
          status: 'CLOSED',
          exitPrice: currentPrice,
          pnlPercent: pnlPct,
          resultType,
        };
      })
    );
  };

  // Emergency Stop Trading Handler
  const handleEmergencyStop = () => {
    setActiveTrades([]);
    setSettings((s) => ({
      ...s,
      autoMode: {
        ...(s.autoMode || {} as any),
        enabled: false,
      },
    }));
  };

  // Stock Market Session Timing
  const stockMarketTiming = computeMarketStatus(stockMarket, {
    observationMinutes: stockSettings.observationPeriodMinutes,
    customTradingStart: stockSettings.customTradingStart,
    customTradingEnd: stockSettings.customTradingEnd,
    customWindowEnabled: stockSettings.customTradingWindowEnabled,
  });

  const isStockMarketClosed = stockMarketTiming.status === 'CLOSED';

  // Stock Market Change Handler
  const handleStockMarketChange = (newMarket: StockMarketId) => {
    setStockMarket(newMarket);
    const loaded = STOCK_UNIVERSE[newMarket] || [];
    setStockUniverse(loaded);
    setSelectedStock(loaded[0] || null);
    setStockSignal(null);
  };

  // Stock Selection Handler
  const handleSelectStock = (stock: StockAsset) => {
    setSelectedStock(stock);
    setStockSignal(null);
  };

  // Toggle Stock Favorite
  const handleToggleStockFavorite = (ticker: string) => {
    setStockFavorites((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  };

  // Stock Market Scanner Execution
  const handleGenerateStockSignal = async () => {
    if (isStockMarketClosed) {
      alert(`Market is currently closed.\n${stockMarketTiming.countdownText}`);
      return;
    }
    if (isLocked) {
      alert(lockReason || 'Trading is temporarily locked by cool-down rules.');
      return;
    }
    if (activeEventWindow.isEventActive) {
      initAudio();
      playNoTradeSound();
      if (selectedStock) {
        const eventTitle = activeEventWindow.activeEvent?.title || 'Economic Event';
        const waitNotice = `High-impact economic event active (${eventTitle}). ±30m window: WAIT returned instead of BUY/SELL.`;
        const res = analyzeStock(selectedStock, stockSettings, {
          isObservationPeriod: stockMarketTiming.isObservationPeriod,
          isSquareOffZone: stockMarketTiming.isSquareOffZone,
          minutesToClose: stockMarketTiming.minutesToClose,
        });
        res.signal = 'WAIT';
        res.strictModeReasons = [waitNotice, ...res.strictModeReasons];
        setStockSignal(res);
      }
      if (activeTab !== 'dashboard') setActiveTab('dashboard');
      return;
    }
    if (isScanningStocks) return;

    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }

    initAudio();
    playRadarPing();
    setIsScanningStocks(true);
    setStockScanProgress({ current: 0, total: stockUniverse.length });

    try {
      const results: StockSignalResult[] = [];
      for (let i = 0; i < stockUniverse.length; i++) {
        const stk = stockUniverse[i];
        setStockScanProgress({ current: i + 1, total: stockUniverse.length, currentTicker: stk.ticker });
        await new Promise((r) => setTimeout(r, 60));

        const res = analyzeStock(stk, stockSettings, {
          isObservationPeriod: stockMarketTiming.isObservationPeriod,
          isSquareOffZone: stockMarketTiming.isSquareOffZone,
          minutesToClose: stockMarketTiming.minutesToClose,
        });
        results.push(res);
      }

      results.sort((a, b) => b.agreementScore - a.agreementScore);
      setStockScannerResults(results);

      const top = results[0];
      if (top) {
        setSelectedStock(stockUniverse.find((s) => s.ticker === top.ticker) || null);
        setStockSignal(top);

        if (top.signal === 'BUY') playLongSignalSound();
        else if (top.signal === 'SELL') playShortSignalSound();
        else playNoTradeSound();

        announceScanComplete(
          top.ticker,
          top.signal === 'BUY' ? 'LONG' : top.signal === 'SELL' ? 'SHORT' : 'NO_TRADE',
          top.entryPrice
        );
      } else {
        playNoTradeSound();
      }

      setIsStockScannerOpen(true);
    } catch (e) {
      console.error('Stock scan error:', e);
      playNoTradeSound();
    } finally {
      setIsScanningStocks(false);
    }
  };

  // Unified Generate Signal Handler (routes based on assetMode)
  const handleMainGenerateSignal = () => {
    if (assetMode === 'crypto') {
      handleGenerateSignal();
    } else {
      handleGenerateStockSignal();
    }
  };

  // Take Stock Paper Trade
  const handleTakeStockTrade = (res: StockSignalResult) => {
    playClickSound();
    triggerHapticVibration([100, 50, 100]);

    const activeCount = stockPaperTrades.filter((t) => t.status === 'ACTIVE').length;
    if (activeCount >= stockSettings.maxOpenTrades) {
      setIsStockCalculatorOpen(true);
      return;
    }

    const durationMin = getTimeLimitDurationMinutes(timeLimit, customTimeLimitMinutes);
    const newTrade: StockPaperTrade = {
      id: `stk_trade_${res.ticker}_${Date.now()}`,
      market: res.market,
      ticker: res.ticker,
      companyName: res.companyName,
      currency: res.currency,
      currencySymbol: res.currencySymbol,
      side: res.signal === 'SELL' ? 'SELL' : 'BUY',
      entryPrice: res.entryPrice,
      shares: Math.max(1, Math.floor(((stockSettings.virtualBalances[res.market] ?? 10000) * (stockSettings.riskPerTradePercent / 100)) / Math.max(0.01, Math.abs(res.entryPrice - res.stopLoss)))),
      positionValue: res.entryPrice * 10,
      stopLoss: res.stopLoss,
      targetPrice1: res.targetPrice1,
      targetPrice2: res.targetPrice2,
      openedAt: Date.now(),
      timeLimitExpiresAt: Date.now() + durationMin * 60 * 1000,
      status: 'ACTIVE',
      pnl: 0,
      pnlPercent: 0,
    };

    setStockPaperTrades((prev) => [newTrade, ...prev]);
    announceTradeStart(res.ticker, res.signal);

    const msg = `📈 [CYBERPULSE STOCKS TRADE SIGNAL]\nMarket: ${res.market} (${res.currency})\nTicker: ${res.ticker} - ${res.companyName}\nSignal: ${res.signal}\nEntry Zone: ${res.currencySymbol}${res.entryZone.min} - ${res.currencySymbol}${res.entryZone.max}\nStop-Loss: ${res.currencySymbol}${res.stopLoss}\nTarget 1: ${res.currencySymbol}${res.targetPrice1}\nTarget 2: ${res.currencySymbol}${res.targetPrice2} (R:R 1:${res.riskRewardRatio})\nPrice Zone: ${res.pricePosition.zone}\nValid For: ${getTimeLimitLabel(timeLimit, customTimeLimitMinutes)}\nAgreement Score: ${res.agreementScore}/100`;
    sendWhatsAppUpdate(msg, 'SIGNAL', res.ticker);
  };

  // Share Stock Signal via WhatsApp
  const handleShareStockWhatsApp = (res: StockSignalResult) => {
    playClickSound();
    const msg = `📈 [CYBERPULSE STOCKS TRADE SIGNAL]\nMarket: ${res.market} (${res.currency})\nTicker: ${res.ticker} - ${res.companyName}\nSignal: ${res.signal}\nEntry Zone: ${res.currencySymbol}${res.entryZone.min} - ${res.currencySymbol}${res.entryZone.max}\nStop-Loss: ${res.currencySymbol}${res.stopLoss}\nTarget 1: ${res.currencySymbol}${res.targetPrice1}\nTarget 2: ${res.currencySymbol}${res.targetPrice2} (R:R 1:${res.riskRewardRatio})\nPrice Zone: ${res.pricePosition.zone}\nValid For: ${getTimeLimitLabel(timeLimit, customTimeLimitMinutes)}\nAgreement Score: ${res.agreementScore}/100`;
    sendWhatsAppUpdate(msg, 'SIGNAL', res.ticker);
  };

  // Auto Scanner Mode B State
  const [autoScannerStats, setAutoScannerStats] = useState<AutoScannerStats>({
    status: 'OFF',
    activeExchange: exchange,
    totalTradablePairs: 0,
    pairsScanned: 0,
    scanProgressPercent: 0,
    longSignalsCount: 0,
    shortSignalsCount: 0,
    waitCount: 0,
    lastScanTime: null,
    nextScanCountdownSeconds: 0,
    currentCommand: null,
    bestOpportunity: null,
    scannedOpportunities: []
  });

  const isScanningHaltRef = useRef(false);
  const continuousTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const announcedSignalKeysRef = useRef<Record<string, number>>({});
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState(false);

  // Keep background Web Audio & WakeLock active when Auto Scanner is ON
  useEffect(() => {
    const isAutoScannerActive = autoScannerStats.status === 'SCANNING' || autoScannerStats.status === 'CONTINUOUS';
    if (isAutoScannerActive) {
      acquireWakeLock();
      startKeepAliveAudio();
      updateMediaSessionState(1, `CyberPulse Auto Scanner (${exchange.toUpperCase()})`);
    } else {
      stopKeepAliveAudio();
      releaseWakeLock();
      updateMediaSessionState(0);
      cancelOngoingSpeech();
    }
  }, [autoScannerStats.status, exchange]);

  // Sync active exchange with user settings
  useEffect(() => {
    setAutoScannerStats((s) => ({ ...s, activeExchange: exchange }));
  }, [exchange]);

  // Finance & Budget Management State
  const [financeData, setFinanceData] = useState<FinanceBudgetData>(() => {
    try {
      const saved = localStorage.getItem('cyberpulse_finance_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      startingBudgetUsd: 5000,
      currentCapitalUsd: 5000,
      availableBalanceUsd: 5000,
      allocatedMarginUsd: 0,
      dailyPnlUsd: 0,
      weeklyPnlUsd: 0,
      monthlyPnlUsd: 0,
      totalFeesPaidUsd: 0,
      riskPerTradePercent: 1.0,
      maxDailyLossPercent: 3.0,
      isDailyLossLocked: false,
      selectedLeverage: 10
    };
  });

  const handleToggleAutoMode = useCallback((enabled: boolean) => {
    if (enabled) {
      setAutoScannerStats((s) => ({
        ...s,
        status: 'COMMAND_READY',
        activeExchange: exchange
      }));
      announceCommandReady();
    } else {
      isScanningHaltRef.current = true;
      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setAutoScannerStats((s) => ({
        ...s,
        status: 'OFF',
        nextScanCountdownSeconds: 0
      }));
      announceScannerStateChange('STOPPED');
    }
  }, [exchange]);

  const runAutoScan = useCallback(async (command: AutoScannerCommand) => {
    if (isLocked) {
      alert(lockReason || 'Trading is temporarily locked by cool-down rules.');
      setAutoScannerStats((s) => ({ ...s, status: 'COMMAND_READY' }));
      return;
    }

    isScanningHaltRef.current = false;
    setAutoScannerStats((s) => ({
      ...s,
      status: 'SCANNING',
      currentCommand: command,
      scanProgressPercent: 0,
      pairsScanned: 0
    }));

    try {
      const res = await executeAutoScanAllPairs(
        exchange,
        timeframe,
        getTimeLimitDurationMinutes(timeLimit, customTimeLimitMinutes),
        (scanned, total) => {
          const pct = Math.round((scanned / total) * 100);
          setAutoScannerStats((s) => ({
            ...s,
            pairsScanned: scanned,
            totalTradablePairs: total,
            scanProgressPercent: pct
          }));
        },
        () => isScanningHaltRef.current,
        activeEventWindow.isEventActive,
        activeEventWindow.activeEvent?.title,
        selectedMarketOption
      );

      setAutoScannerStats((s) => ({
        ...s,
        status: s.status === 'CONTINUOUS' ? 'CONTINUOUS' : 'COMMAND_READY',
        lastScanTime: Date.now(),
        scanProgressPercent: 100,
        pairsScanned: res.scannedCount,
        totalTradablePairs: res.totalTradable,
        longSignalsCount: res.longCount,
        shortSignalsCount: res.shortCount,
        waitCount: res.waitCount,
        bestOpportunity: res.bestOpportunity,
        scannedOpportunities: res.signals
      }));

      // Automatic Multi-Exchange Voice Alert & Push Notification for ALL newly confirmed signals
      const confirmedSignals = res.signals.filter((s) => s.direction === 'LONG' || s.direction === 'SHORT' || s.direction === 'BUY' || s.direction === 'SELL');
      const now = Date.now();

      confirmedSignals.forEach((sig) => {
        const sigKey = `${sig.exchange}_${sig.marketType || 'FUTURES'}_${sig.symbol}_${sig.direction}_${sig.timeframe}`;
        const lastAnnounced = announcedSignalKeysRef.current[sigKey] || 0;

        // Deduplicate: speak if not announced in the last 15 minutes
        if (now - lastAnnounced > 15 * 60 * 1000) {
          announcedSignalKeysRef.current[sigKey] = now;

          const exName = sig.exchange === 'binance' ? 'Binance' : 'Bitget';
          const mType = (sig.marketType || (selectedMarketOption.endsWith('SPOT') ? 'SPOT' : 'FUTURES')) === 'SPOT' ? 'Spot' : 'Futures';

          // Multi-exchange voice alert: "New Binance Spot BUY signal for BTC/USDT"
          announceMultiExchangeSignal(exName, mType, sig.direction as any, sig.displayName);

          // Dispatch mobile web notification
          sendWebNotification(`⚡ NEW ${sig.direction} SIGNAL: ${sig.displayName}`, {
            body: `${sig.displayName} (${exName} ${mType}) ${sig.direction} | TF: ${sig.timeframe} | Conf: ${sig.confidenceScore}% | Entry: $${sig.entryPrice}`,
            tag: `signal-${sig.symbol}-${sig.direction}`,
          });
        }
      });

      // Voice announcements based on command
      if (command === 'FIND_BEST_LONG') {
        const bestLong = res.signals.find((sig) => sig.direction === 'LONG' || sig.direction === 'BUY');
        if (bestLong) {
          playLongSignalSound();
          announceBestDirectionalSignal('LONG', bestLong.displayName, bestLong.entryPrice, bestLong.recommendedLeverage);
        } else {
          announceNoOpportunityFound();
        }
      } else if (command === 'FIND_BEST_SHORT') {
        const bestShort = res.signals.find((sig) => sig.direction === 'SHORT' || sig.direction === 'SELL');
        if (bestShort) {
          playShortSignalSound();
          announceBestDirectionalSignal('SHORT', bestShort.displayName, bestShort.entryPrice, bestShort.recommendedLeverage);
        } else {
          announceNoOpportunityFound();
        }
      } else if (command === 'FIND_BEST_OPPORTUNITY') {
        if (res.bestOpportunity && res.bestOpportunity.direction !== 'NO_TRADE' && res.bestOpportunity.direction !== 'WAIT') {
          const isLongish = res.bestOpportunity.direction === 'LONG' || res.bestOpportunity.direction === 'BUY';
          if (isLongish) playLongSignalSound();
          else playShortSignalSound();
          announceBestOpportunity(
            res.bestOpportunity.displayName,
            isLongish ? 'LONG' : 'SHORT',
            res.bestOpportunity.entryPrice,
            res.bestOpportunity.setupScore,
            res.bestOpportunity.recommendedLeverage,
            timeframe
          );
        } else {
          announceNoOpportunityFound();
        }
      } else {
        if (res.bestOpportunity && res.bestOpportunity.direction !== 'NO_TRADE' && res.bestOpportunity.direction !== 'WAIT') {
          const isLongish = res.bestOpportunity.direction === 'LONG' || res.bestOpportunity.direction === 'BUY';
          announceBestOpportunity(
            res.bestOpportunity.displayName,
            isLongish ? 'LONG' : 'SHORT',
            res.bestOpportunity.entryPrice,
            res.bestOpportunity.setupScore,
            res.bestOpportunity.recommendedLeverage,
            timeframe
          );
        } else {
          announceNoOpportunityFound();
        }
      }

      // Log best opportunity to Signal History with source: 'AUTO'
      if (res.bestOpportunity && res.bestOpportunity.direction !== 'NO_TRADE') {
        const histSignal: SignalResult = {
          id: `auto-${Date.now()}-${res.bestOpportunity.symbol}`,
          timestamp: Date.now(),
          exchange,
          symbol: res.bestOpportunity.symbol,
          displayName: res.bestOpportunity.displayName,
          timeframe,
          signal: res.bestOpportunity.direction,
          entryPrice: res.bestOpportunity.entryPrice,
          stopLoss: res.bestOpportunity.stopLoss,
          targetPrice1: res.bestOpportunity.takeProfit1,
          targetPrice2: res.bestOpportunity.takeProfit2,
          targetPrice3: res.bestOpportunity.takeProfit3,
          riskRewardRatio: res.bestOpportunity.riskRewardRatio,
          confidenceScore: res.bestOpportunity.confidenceScore,
          source: 'AUTO',
          recommendedLeverage: res.bestOpportunity.recommendedLeverage,
          liquidationPrice: res.bestOpportunity.estimatedLiquidationPrice,
          reviewTime: res.bestOpportunity.expiryTimestamp,
          aiAnalysis: res.bestOpportunity.aiMarketAnalysisNarrative,
          factorsSummary: {
            bullishCount: res.bestOpportunity.direction === 'LONG' ? 7 : 1,
            bearishCount: res.bestOpportunity.direction === 'SHORT' ? 7 : 1,
            neutralCount: 1,
            totalFactors: 9,
            agreementRatio: 0.88
          },
          strategyName: 'AI Auto 27-Point Multi-Factor',
          strategyDescription: 'Quantitative multi-indicator confluence and momentum breakout',
          strictMode: true,
          reasons: res.bestOpportunity.reasons,
          factors: []
        };
        setHistory((prev) => [histSignal, ...prev.slice(0, 99)]);
      }
    } catch {
      setAutoScannerStats((s) => ({
        ...s,
        status: 'COMMAND_READY'
      }));
    }
  }, [exchange, timeframe, timeLimit, customTimeLimitMinutes]);

  const handleExecuteAutoCommand = useCallback((command: AutoScannerCommand) => {
    playClickSound();

    if (command === 'STOP') {
      isScanningHaltRef.current = true;
      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setAutoScannerStats((s) => ({
        ...s,
        status: 'COMMAND_READY',
        nextScanCountdownSeconds: 0
      }));
      announceScannerStateChange('STOPPED');
      return;
    }

    if (command === 'PAUSE') {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setAutoScannerStats((s) => ({ ...s, status: 'PAUSED' }));
      announceScannerStateChange('PAUSED');
      return;
    }

    if (command === 'RESUME') {
      setAutoScannerStats((s) => ({ ...s, status: 'CONTINUOUS' }));
      announceScannerStateChange('RESUMED');
      handleExecuteAutoCommand('START_CONTINUOUS');
      return;
    }

    if (command === 'START_CONTINUOUS') {
      setAutoScannerStats((s) => ({ ...s, status: 'CONTINUOUS' }));
      announceScannerStateChange('CONTINUOUS');
      runAutoScan('START_CONTINUOUS');

      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      let remaining = 180;
      setAutoScannerStats((s) => ({ ...s, nextScanCountdownSeconds: remaining }));

      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          remaining = 180;
          runAutoScan('START_CONTINUOUS');
        }
        setAutoScannerStats((s) => ({ ...s, nextScanCountdownSeconds: remaining }));
      }, 1000);

      return;
    }

    runAutoScan(command);
  }, [runAutoScan]);

  const handleTake27PointTrade = useCallback((signal: FullSignal27Point, leverage: number) => {
    const durationMin = getTimeLimitDurationMinutes(timeLimit, customTimeLimitMinutes);
    const now = Date.now();
    const newTrade: ActiveLiveTrade = {
      id: `trade-${now}-${signal.symbol}`,
      symbol: signal.symbol,
      displayName: signal.displayName,
      exchange: signal.exchange,
      direction: (signal.direction === 'SHORT' || signal.direction === 'SELL') ? 'SHORT' : 'LONG',
      entryZoneMin: signal.entryZoneMin,
      entryZoneMax: signal.entryZoneMax,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit1: signal.takeProfit1,
      takeProfit2: signal.takeProfit2,
      timeframe: signal.timeframe,
      durationMinutes: durationMin,
      startTime: now,
      targetEndTime: now + durationMin * 60 * 1000,
      status: 'ACTIVE',
      entryTouched: true,
      announced50Pct: false,
      announced5Min: false,
      last10sCounted: 10,
      agreementScore: signal.setupScore,
      timeLimitLabel: `${durationMin}m`
    };

    setActiveTrades((prev) => [newTrade, ...prev]);
    announceTradeStart(signal.displayName, signal.direction);

    // Margin allocation in Finance
    const margin = (financeData.currentCapitalUsd * 0.01) / (signal.stopLossDistancePercent / 100) / leverage;
    setFinanceData((prev) => {
      const next = {
        ...prev,
        availableBalanceUsd: Math.max(0, prev.availableBalanceUsd - margin),
        allocatedMarginUsd: prev.allocatedMarginUsd + margin
      };
      localStorage.setItem('cyberpulse_finance_data', JSON.stringify(next));
      return next;
    });
  }, [timeLimit, customTimeLimitMinutes, financeData.currentCapitalUsd]);

  const handleShare27PointWhatsApp = useCallback(async (signal: FullSignal27Point) => {
    playClickSound();
    const msg = `⚡ *CYBERPULSE FUTURES AUTO SIGNAL*\n` +
      `Exchange: ${signal.exchange.toUpperCase()} Futures\n` +
      `Pair: ${signal.displayName}\n` +
      `Signal: ${signal.direction}\n` +
      `Current Price: $${formatCryptoPrice(signal.currentPrice)}\n` +
      `Suggested Entry: $${formatCryptoPrice(signal.entryPrice)}\n` +
      `Entry Zone: $${formatCryptoPrice(signal.entryZoneMin)} - $${formatCryptoPrice(signal.entryZoneMax)}\n` +
      `Recommended Leverage: ${signal.recommendedLeverage}x (Est Liq: $${formatCryptoPrice(signal.estimatedLiquidationPrice)})\n` +
      `Stop Loss: $${formatCryptoPrice(signal.stopLoss)} (-${signal.stopLossDistancePercent}%)\n` +
      `Take Profit 1: $${formatCryptoPrice(signal.takeProfit1)} (+${signal.takeProfit1DistancePercent}%)\n` +
      `Take Profit 2: $${formatCryptoPrice(signal.takeProfit2)} (+${signal.takeProfit2DistancePercent}%)\n` +
      `Take Profit 3: $${formatCryptoPrice(signal.takeProfit3)} (+${signal.takeProfit3DistancePercent}%)\n` +
      `Setup Score: ${signal.setupScore}/100 | Confidence: ${signal.confidenceScore}%\n` +
      `Holding Limit: ${signal.holdingPeriod}\n` +
      `Plan: ${signal.aiMarketAnalysisNarrative}`;

    try {
      const recipients = settings.whatsappRecipients && settings.whatsappRecipients.length > 0
        ? settings.whatsappRecipients
        : DEFAULT_WHATSAPP_RECIPIENTS;

      const logs = await dispatchToEnabledRecipients(
        msg,
        'SIGNAL',
        signal.displayName,
        recipients,
        settings.whatsappMode || 'quick_share'
      );
      if (logs.length > 0) {
        setWhatsappLogs((prev) => [...logs, ...prev.slice(0, 99)]);
      }
    } catch (err) {
      console.error('WhatsApp 27-Point dispatch error:', err);
    }
  }, [settings.whatsappRecipients, settings.whatsappMode]);

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    localStorage.setItem(STORAGE_KEYS.DISCLAIMER, 'true');
    setSettings((prev) => ({ ...prev, disclaimerAccepted: true }));
  };

  const isCurrentTradeActive = Boolean(
    currentSignal &&
      activeTrades.some(
        (t) =>
          t.symbol === currentSignal.symbol &&
          (t.status === 'ACTIVE' || t.status === 'PENDING_ENTRY')
      )
  );

  // Compute Measured Win Rate for selected pair & timeframe
  const matchingPaperTrades = paperTrades.filter(
    (pt) => pt.symbol === selectedPair?.symbol && pt.timeframe === timeframe
  );
  const matchingWins = matchingPaperTrades.filter((pt) => pt.result === 'WIN').length;
  const measuredWinRateText = matchingPaperTrades.length >= 30
    ? `${((matchingWins / matchingPaperTrades.length) * 100).toFixed(1)}% (${matchingPaperTrades.length} trades logged)`
    : `Not enough data yet (${matchingPaperTrades.length}/30 trades logged)`;

  // Overall paper stats for Live Mode qualification & expectancy calculation
  const paperWinsList = paperTrades.filter((t) => t.result === 'WIN');
  const paperLossesList = paperTrades.filter((t) => t.result === 'LOSS');
  const totalPaperTradesCount = paperTrades.length;
  const overallPaperWinRate = totalPaperTradesCount > 0 ? (paperWinsList.length / totalPaperTradesCount) * 100 : 0;
  const overallPaperNetPnlUsd = paperTrades.reduce((acc, pt) => acc + (pt.pnlUsd || 0), 0);

  const totalWinUsd = paperWinsList.reduce((s, t) => s + (t.pnlUsd || 0), 0);
  const totalLossUsd = Math.abs(paperLossesList.reduce((s, t) => s + (t.pnlUsd || 0), 0));
  const avgWinUsd = paperWinsList.length > 0 ? totalWinUsd / paperWinsList.length : 0;
  const avgLossUsd = paperLossesList.length > 0 ? totalLossUsd / paperLossesList.length : 0;
  const avgFeesUsd = totalPaperTradesCount > 0 ? paperTrades.reduce((s, t) => s + (t.feesPaidUsd || 0), 0) / totalPaperTradesCount : 0;
  const winProb = totalPaperTradesCount > 0 ? paperWinsList.length / totalPaperTradesCount : 0;
  const lossProb = totalPaperTradesCount > 0 ? paperLossesList.length / totalPaperTradesCount : 0;
  const paperExpectancyUsd = (winProb * avgWinUsd) - (lossProb * avgLossUsd) - avgFeesUsd;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Fallback Banner if offline bundled pairs list is used */}
      {assetMode === 'crypto' && isUsingFallback && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-between text-xs font-mono text-amber-300">
          <span>⚠️ Using offline pair list, may be outdated</span>
          <span className="text-[10px] text-amber-400">Offline Fallback</span>
        </div>
      )}

      {/* Non-Bypassable Cool-Down Lock: 2-Loss Lockout (Requirement 4) */}
      {isRevengeCooldownActive && (
        <div className="bg-rose-950/95 border-b border-rose-500 px-3 py-2.5 flex items-center justify-between text-xs font-mono text-rose-200 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">🛑</span>
            <div>
              <strong className="block text-rose-300 font-bold">Take a break, do not revenge-trade</strong>
              <span className="text-[11px] text-rose-400">2 consecutive losses logged. Signal generation is locked for {Math.floor(revengeCooldownRemainingSecs / 60)}m {revengeCooldownRemainingSecs % 60}s.</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/60 uppercase">
            Locked
          </span>
        </div>
      )}

      {/* Non-Bypassable Cool-Down Lock: Daily Loss Lockout (Requirement 4) */}
      {isDailyLossCooldownActive && (
        <div className="bg-rose-950/95 border-b border-rose-500 px-3 py-2.5 flex items-center justify-between text-xs font-mono text-rose-200 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <div>
              <strong className="block text-rose-300 font-bold">Daily loss limit reached. Trading locked until tomorrow.</strong>
              <span className="text-[11px] text-rose-400">Protection active until 00:00 midnight local time. Safeguarding remaining capital.</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/60 uppercase">
            Locked 24h
          </span>
        </div>
      )}

      {/* High-Impact Economic Event Warning Banner (±30m Window) (Requirement 1) */}
      <EventWarningBanner
        activeEvent={activeEventWindow.activeEvent}
        statusText={activeEventWindow.statusText}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
      />

      {/* Top Header with Asset Switch & 8-Market Selector */}
      <Header
        assetMode={assetMode}
        onAssetModeChange={setAssetMode}
        exchange={exchange}
        onExchangeChange={handleExchangeChange}
        selectedPair={selectedPair}
        onOpenPairModal={() => setIsPairModalOpen(true)}
        livePrice={livePrice}
        priceChangePercent24h={priceChange24h}
        stockMarket={stockMarket}
        onStockMarketChange={handleStockMarketChange}
        selectedStock={selectedStock}
        onOpenStockModal={() => setIsStockSelectorOpen(true)}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => {
          const next = !settings.soundEnabled;
          setSettings((s) => ({ ...s, soundEnabled: next }));
        }}
        strictMode={assetMode === 'crypto' ? settings.strictMode : stockSettings.strictMode}
        onOpenCalculator={() => {
          if (assetMode === 'crypto') {
            setIsCalculatorOpen(true);
          } else {
            setIsStockCalculatorOpen(true);
          }
        }}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        hasActiveEventWindow={activeEventWindow.isEventActive}
        onSelectPocketOption={() => setActiveTab('pocketoption')}
        onSelectQuotex={() => setActiveTab('quotex')}
        onSelectCompounding={() => setActiveTab('compounding')}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-3 py-3 flex flex-col gap-3">
        {activeTab === 'dashboard' && (
          <>
            {assetMode === 'crypto' ? (
              /* CRYPTO FUTURES DASHBOARD */
              <>
                {/* Master Control Header Card */}
                <MasterControlHeaderCard
                  activeExchange={exchange}
                  timeframe={timeframe}
                  scannerStats={autoScannerStats}
                  voiceEnabled={settings.voiceEnabled}
                  onToggleVoice={(enabled) => setSettings((s) => ({ ...s, voiceEnabled: enabled }))}
                  onStartScanner={() => {
                    handleToggleAutoMode(true);
                    runAutoScan('FIND_BEST_OPPORTUNITY');
                  }}
                  onStopScanner={() => {
                    handleToggleAutoMode(false);
                  }}
                  onEmergencyStop={handleEmergencyStop}
                  apiConnected={wsConnected}
                  isLiveModeSelected={settings.isLiveModeSelected || false}
                  onToggleLiveMode={(live) => setSettings((s) => ({ ...s, isLiveModeSelected: live }))}
                  onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
                />
                {/* Mode B Quick Status & Toggle Strip */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-cyan-500/30 p-2.5 rounded-xl text-xs font-mono shadow-md">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${autoScannerStats.status !== 'OFF' ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                    <span className="font-bold text-white">Mode B: AI Auto All Pairs</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                      autoScannerStats.status !== 'OFF' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {autoScannerStats.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playClickSound();
                        handleToggleAutoMode(autoScannerStats.status === 'OFF');
                      }}
                      className={`px-3 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                        autoScannerStats.status !== 'OFF' ? 'bg-cyan-500 text-slate-950 glow-cyan' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {autoScannerStats.status !== 'OFF' ? '⚡ AUTO ON' : '⚡ AUTO OFF'}
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        setActiveTab('autoscanner');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold transition cursor-pointer"
                    >
                      Open Panel →
                    </button>
                  </div>
                </div>

                {/* Auto Mode Status Bar if enabled */}
                <AutoModeBar
                  autoMode={settings.autoMode}
                  nextScanSeconds={autoModeCountdownSecs}
                  onStop={() => {
                    setSettings((s) => ({
                      ...s,
                      autoMode: {
                        ...(s.autoMode || {} as any),
                        enabled: false,
                      },
                    }));
                  }}
                />

                {/* Live Stats & Funding Bar */}
                <LivePriceBar
                  pair={selectedPair}
                  high24h={high24h}
                  low24h={low24h}
                  volume24h={volume24h}
                  derivatives={derivatives}
                  wsConnected={wsConnected}
                />

                {/* Exchange & Market Option Selector (4 Options) */}
                <MarketOptionSelector
                  selectedMarketOption={selectedMarketOption}
                  onSelectMarketOption={(opt) => {
                    setSelectedMarketOption(opt);
                    localStorage.setItem('cyberpulse_market_option', opt);
                    const newEx = opt.startsWith('BINANCE') ? 'binance' : 'bitget';
                    setExchange(newEx);
                    localStorage.setItem(STORAGE_KEYS.EXCHANGE, newEx);
                  }}
                  pairs={pairs}
                  selectedPair={selectedPair}
                  onSelectPair={(p) => {
                    setSelectedPair(p);
                    localStorage.setItem(STORAGE_KEYS.PAIR, JSON.stringify(p));
                  }}
                />

                {/* Smart Money & Whale Tracker Panel */}
                <SmartMoneyPanel
                  marketOptionId={selectedMarketOption}
                  selectedPair={selectedPair}
                  timeframe={timeframe}
                  coinGlassApiKey={settings.coinGlassApiKey}
                />

                {/* Buyer vs Seller Pressure Indicator */}
                <BuyerSellerPressureGauge
                  exchange={exchange}
                  selectedPair={selectedPair}
                  timeframe={timeframe}
                />

                {/* Active Live Trades Board with Wall-Clock Timers & Emergency Stop */}
                <ActiveTradesBoard
                  trades={activeTrades.filter((t) => t.status === 'ACTIVE' || t.status === 'PENDING_ENTRY')}
                  onCloseTrade={handleCloseActiveTrade}
                  onEmergencyStop={handleEmergencyStop}
                  livePrices={livePricesMap}
                />

                {/* Active Tracked Pair Alerts Banner */}
                {trackedAlert && (
                  <TrackedPairAlertBar
                    alert={trackedAlert}
                    onClearTrack={() => setTrackedAlert(null)}
                    currentPrice={livePrice}
                  />
                )}

                {/* Holding Time Limit Selector Bar */}
                <TimeLimitSelector
                  selectedLimit={timeLimit}
                  customMinutes={customTimeLimitMinutes}
                  onSelectLimit={handleSelectTimeLimit}
                  activeTimeframe={timeframe}
                />

                {/* Central Futuristic Radar Gauge */}
                <RadarGauge
                  isAnalyzing={isAnalyzing}
                  analysisProgress={analysisProgress}
                  analysisPhase={analysisPhase}
                  signal={currentSignal}
                />

                {/* Generated Signal Result Card */}
                {currentSignal ? (
                  <SignalCard
                    signal={currentSignal}
                    onOpenBreakdown={() => setIsBreakdownOpen(true)}
                    validForLabel={getTimeLimitLabel(timeLimit, customTimeLimitMinutes)}
                    onTakeTrade={handleTakeTrade}
                    isTradeActive={isCurrentTradeActive}
                    measuredWinRateText={measuredWinRateText}
                  />
                ) : (
                  <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 text-center flex flex-col items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      CRYPTO FUTURES RADAR ARMED
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                      Select your holding limit above, then tap the center <strong className="text-cyan-300">"Generate Signal"</strong> button below to scan all liquid pairs on {exchange === 'binance' ? 'Binance Futures' : 'Bitget Futures'}.
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* STOCKS DASHBOARD */
              <>
                {/* Market Hours Panel (Dual clocks, countdown, status, observation warning) */}
                <MarketHoursPanel
                  marketId={stockMarket}
                  observationMinutes={stockSettings.observationPeriodMinutes}
                  customTradingStart={stockSettings.customTradingStart}
                  customTradingEnd={stockSettings.customTradingEnd}
                  customWindowEnabled={stockSettings.customTradingWindowEnabled}
                />

                {/* Holding Time Limit Selector */}
                <TimeLimitSelector
                  selectedLimit={timeLimit}
                  customMinutes={customTimeLimitMinutes}
                  onSelectLimit={handleSelectTimeLimit}
                  activeTimeframe={timeframe}
                />

                {/* Stock Signal Result Card or Scanner Ready Banner */}
                {stockSignal ? (
                  <StockSignalCard
                    result={stockSignal}
                    onOpenCalculator={() => setIsStockCalculatorOpen(true)}
                    onTakeTrade={() => handleTakeStockTrade(stockSignal)}
                    onShareWhatsApp={() => handleShareStockWhatsApp(stockSignal)}
                  />
                ) : (
                  <div className="rounded-2xl bg-slate-900/50 border border-cyan-500/30 p-5 text-center flex flex-col items-center gap-2 shadow-lg">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-400 shadow glow-cyan">
                      <span className="text-xl">📈</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-white tracking-wide">
                      {STOCK_MARKETS[stockMarket].name} Scanner Ready
                    </span>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Tap the center <strong className="text-cyan-300">"Generate Signal"</strong> button below to scan liquid constituents across {STOCK_MARKETS[stockMarket].fullName} using multi-factor trend, VWAP, ORB, and Strict Mode rules.
                    </p>
                    {isStockMarketClosed && (
                      <div className="mt-1 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono">
                        {stockMarketTiming.countdownText}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* MODE B: AUTO SCANNER TAB */}
        {activeTab === 'autoscanner' && (
          <AutoScannerDashboard
            activeExchange={exchange}
            timeframe={timeframe}
            stats={autoScannerStats}
            voiceLanguage={settings.voiceLanguage}
            onToggleAutoMode={handleToggleAutoMode}
            onExecuteCommand={handleExecuteAutoCommand}
            onTakeTrade={(sig, lev) => handleTake27PointTrade(sig, lev)}
            onShareWhatsApp={(sig) => handleShare27PointWhatsApp(sig)}
          />
        )}

        {/* FINANCE & BUDGET TAB */}
        {activeTab === 'finance' && (
          <FinanceBudgetDashboard
            financeData={financeData}
            trades={paperTrades}
            onUpdateFinance={(updated) => setFinanceData((prev) => {
              const next = { ...prev, ...updated };
              localStorage.setItem('cyberpulse_finance_data', JSON.stringify(next));
              return next;
            })}
            onResetBudget={() => {
              const resetVal: FinanceBudgetData = {
                ...financeData,
                startingBudgetUsd: 5000,
                currentCapitalUsd: 5000,
                availableBalanceUsd: 5000,
                allocatedMarginUsd: 0,
                isDailyLossLocked: false
              };
              setFinanceData(resetVal);
              localStorage.setItem('cyberpulse_finance_data', JSON.stringify(resetVal));
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            paperTrades={paperTrades}
            whatsappLogs={whatsappLogs}
            onClearHistory={() => setHistory([])}
            onClearPaperTrades={() => setPaperTrades([])}
            onClearWhatsAppLogs={() => setWhatsappLogs([])}
            onSelectSignal={(sig) => {
              setCurrentSignal(sig);
              setActiveTab('dashboard');
            }}
            selectedPairSymbol={selectedPair?.symbol}
            currentTimeframe={timeframe}
            recentKlines={recentKlines}
          />
        )}

        {activeTab === 'pocketoption' && <PocketOptionView />}

        {activeTab === 'quotex' && <QuotexView />}

        {activeTab === 'compounding' && (
          <CompoundingTradingDashboard
            activeExchange={exchange}
            timeframe={timeframe}
            selectedPair={selectedPair}
            onCloseModal={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(updated) => setSettings((s) => ({ ...s, ...updated }))}
            onSelectExchange={handleExchangeChange}
            stockSettings={stockSettings}
            onUpdateStockSettings={(updated) => setStockSettings((s) => ({ ...s, ...updated }))}
            onOpenDisclaimer={() => setDisclaimerAccepted(false)}
            totalPaperTradesCount={paperTrades.length}
            paperWinRate={overallPaperWinRate}
            paperNetPnlUsd={overallPaperNetPnlUsd}
            paperExpectancyUsd={paperExpectancyUsd}
            onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          />
        )}
      </main>

      {/* Mandatory Footer Disclaimer on Every Screen */}
      <footer className="text-center pb-24 text-[10px] font-mono text-slate-500 px-4 leading-relaxed max-w-lg mx-auto">
        {assetMode === 'stocks'
          ? 'Analysis is based on technical data and can be wrong. Not financial advice. Stock trading can lose money. Never trade with borrowed money.'
          : 'Analysis is based on technical data and can be wrong. Not financial advice. Futures trading with leverage can lose your entire balance. Never trade with borrowed money.'}
      </footer>

      {/* Bottom Navigation with Raised Pulsing Center Button */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        onGenerateSignal={handleMainGenerateSignal}
        isAnalyzing={assetMode === 'crypto' ? isAnalyzing : isScanningStocks}
        isMarketClosed={assetMode === 'stocks' && isStockMarketClosed}
        marketClosedReason={stockMarketTiming.nextSessionText}
        isAutoModeOn={autoScannerStats.status !== 'OFF'}
        isLocked={isLocked}
        lockReason={lockReason}
        lockCountdownText={lockCountdownText}
      />

      {/* Pre-Trade 15-to-1 Countdown & Alarm Overlay */}
      {preTradeTarget && (
        <PreTradeWarningOverlay
          isOpen={isPreTradeWarningOpen}
          pair={preTradeTarget.pair}
          direction={preTradeTarget.direction}
          entryPrice={preTradeTarget.entryPrice}
          countdownSeconds={settings.preTradeCountdownSeconds || 15}
          onCountdownComplete={() => {
            setIsPreTradeWarningOpen(false);
          }}
          onDismiss={() => {
            setIsPreTradeWarningOpen(false);
          }}
        />
      )}

      {/* Crypto: Top 5 Market Scanner Results Modal */}
      <ScannerResultsModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        topPairs={topScannedPairs}
        onSelectPair={handleSelectScannedPair}
        selectedPair={selectedPair}
        scannedTotalCount={totalScannedPoolCount}
        timeframe={timeframe}
      />

      {/* Crypto: Pair Selector Search Modal */}
      <PairSelectorModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        pairs={pairs}
        selectedPair={selectedPair}
        onSelectPair={handleSelectPair}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        activeProductType={activeProductType}
        onChangeProductType={(pt) => {
          setActiveProductType(pt);
        }}
        exchange={exchange}
        isUsingFallback={isUsingFallback}
      />

      {/* Crypto: 8-Factor Breakdown Modal */}
      <FactorsBreakdownModal
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        signal={currentSignal}
      />

      {/* Crypto: Position Size & Risk Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        pair={selectedPair}
        entryPrice={livePrice || currentSignal?.entryPrice || 100}
        stopLossPrice={currentSignal?.stopLoss || (livePrice ? livePrice * 0.98 : 98)}
        takeProfitPrice={currentSignal?.targetPrice2}
        direction={currentSignal?.signal === 'SHORT' ? 'SHORT' : 'LONG'}
        settings={settings}
        onExecutePaperTrade={(size, lev) => {
          triggerHapticVibration([100, 50, 100]);
        }}
      />

      {/* Stocks: Stock Selector Modal */}
      <StockSelectorModal
        isOpen={isStockSelectorOpen}
        onClose={() => setIsStockSelectorOpen(false)}
        marketId={stockMarket}
        stocks={stockUniverse}
        selectedTicker={selectedStock?.ticker || ''}
        onSelectStock={handleSelectStock}
        favorites={stockFavorites}
        onToggleFavorite={handleToggleStockFavorite}
      />

      {/* Stocks: Top 5 Stock Scanner Modal */}
      <StockScannerModal
        isOpen={isStockScannerOpen}
        onClose={() => setIsStockScannerOpen(false)}
        isScanning={isScanningStocks}
        scanProgress={stockScanProgress}
        rankedResults={stockScannerResults}
        onSelectStockResult={(res) => {
          setSelectedStock(stockUniverse.find((s) => s.ticker === res.ticker) || null);
          setStockSignal(res);
          setIsStockScannerOpen(false);
        }}
      />

      {/* Stocks: Position Sizing & Risk Calculator Modal */}
      <StockRiskCalculatorModal
        isOpen={isStockCalculatorOpen}
        onClose={() => setIsStockCalculatorOpen(false)}
        marketId={stockMarket}
        entryPrice={selectedStock?.currentPrice || stockSignal?.entryPrice || 100}
        stopLossPrice={stockSignal?.stopLoss || ((selectedStock?.currentPrice || 100) * 0.98)}
        currentOpenTradesCount={stockPaperTrades.filter((t) => t.status === 'ACTIVE').length}
        dailyLossPercent={0}
        userSettings={stockSettings}
        onUpdateSettings={(updated) => setStockSettings((s) => ({ ...s, ...updated }))}
      />

      {/* High-Impact Economic Event Calendar Modal (Requirement 1) */}
      <EventCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        events={economicEvents}
        activeEvent={activeEventWindow.activeEvent}
        apiKey={settings.calendarApiKey}
        onSaveApiKey={(key: string) => setSettings((s) => ({ ...s, calendarApiKey: key }))}
        onSimulateEvent={(mock) => setEconomicEvents((prev) => [mock, ...prev])}
      />

      {/* Android Screen-Off & Foreground Service Guide Modal */}
      <AndroidForegroundServiceGuideModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
        isWakeLockActive={Boolean(autoScannerStats.status === 'SCANNING' || autoScannerStats.status === 'CONTINUOUS')}
        isKeepAliveAudioActive={Boolean(autoScannerStats.status === 'SCANNING' || autoScannerStats.status === 'CONTINUOUS')}
        pushPermission={typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'}
        onRequestPush={async () => {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            await Notification.requestPermission();
            sendWebNotification('CyberPulse Mobile Notifications Active', {
              body: 'Real-time background signal, TP/SL, and risk alerts enabled.',
            });
          }
        }}
      />

      {/* First Launch Risk Disclaimer Modal */}
      <DisclaimerModal
        isOpen={!disclaimerAccepted}
        onAccept={handleAcceptDisclaimer}
      />
    </div>
  );
}
