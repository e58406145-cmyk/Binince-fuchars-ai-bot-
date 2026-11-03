/**
 * Smart $5 Auto Compounding Trading System Engine
 * - Starting Balance: $5.00 USDT
 * - Controlled profit reinvestment (compounding)
 * - Anti-martingale, conservative risk controls
 * - Demo mode default with Binance Spot & Bitget Spot live readiness
 */

import { ExchangeId, Timeframe, CryptoPair, KlineData } from '../types/crypto';
import { fetchBinanceKlines, fetchBinancePairs } from './api/binance';
import { fetchBitgetKlines, fetchBitgetPairs } from './api/bitget';
import { calculateEMA, calculateRSI, calculateMACD, calculateATR, findSupportResistance } from '../utils/indicators';

export interface CompoundingTradeRecord {
  id: string;
  timestamp: number;
  exchange: ExchangeId;
  symbol: string;
  displayName: string;
  timeframe: Timeframe;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  positionSizeUsd: number;
  startBalanceUsd: number;
  endBalanceUsd?: number;
  pnlUsd?: number;
  pnlPercent?: number;
  status: 'OPEN' | 'WIN' | 'LOSS' | 'STOPPED';
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

export interface CompoundingState {
  initialBalanceUsd: number; // Default $5.00
  currentBalanceUsd: number;
  highWaterMarkUsd: number;
  isLiveMode: boolean;
  isAutoTradingActive: boolean;
  isPaused: boolean;
  reinvestPercent: number; // e.g. 50% of profits reinvested, 50% locked
  maxRiskPerTradePercent: number; // e.g. 2% to 5% max risk
  maxDailyLossPercent: number; // e.g. 10% max daily loss ($0.50 on $5)
  dailyLossUsd: number;
  totalTrades: number;
  wins: number;
  losses: number;
  maxDrawdownPercent: number;
  history: CompoundingTradeRecord[];
  activeTrade: CompoundingTradeRecord | null;
  lastTradeTime: number;
}

const STORAGE_KEY = 'cyberpulse_compounding_state_v1';

export const DEFAULT_COMPOUNDING_STATE: CompoundingState = {
  initialBalanceUsd: 5.00,
  currentBalanceUsd: 5.00,
  highWaterMarkUsd: 5.00,
  isLiveMode: false,
  isAutoTradingActive: false,
  isPaused: false,
  reinvestPercent: 50, // 50% profit reinvestment
  maxRiskPerTradePercent: 3, // 3% risk per trade
  maxDailyLossPercent: 10, // 10% daily loss limit
  dailyLossUsd: 0,
  totalTrades: 0,
  wins: 0,
  losses: 0,
  maxDrawdownPercent: 0,
  history: [],
  activeTrade: null,
  lastTradeTime: 0,
};

export function loadCompoundingState(): CompoundingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COMPOUNDING_STATE, ...parsed };
    }
  } catch {}
  return DEFAULT_COMPOUNDING_STATE;
}

export function saveCompoundingState(state: CompoundingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Calculates next position size based on current available balance & reinvestment rules
 * Example: Starting $5.00 -> 3% risk ($0.15 max loss) or 50% position ($2.50 spot trade)
 */
export function calculateCompoundingPositionSize(
  currentBalance: number,
  reinvestPercent = 50,
  maxRiskPercent = 3,
  stopLossPercent = 1.5
): { positionSizeUsd: number; maxLossUsd: number } {
  if (currentBalance < 1.0) {
    return { positionSizeUsd: 0, maxLossUsd: 0 };
  }

  // Position size is capped at controlled percentage of balance (e.g. 50% of balance)
  const basePositionSize = currentBalance * (reinvestPercent / 100);
  // Ensure max loss doesn't exceed risk budget
  const maxRiskUsd = currentBalance * (maxRiskPercent / 100);
  const positionByRisk = maxRiskUsd / (stopLossPercent / 100);

  const finalPositionSize = Math.min(basePositionSize, positionByRisk, currentBalance);
  return {
    positionSizeUsd: parseFloat(Math.max(1.0, finalPositionSize).toFixed(2)),
    maxLossUsd: parseFloat(maxRiskUsd.toFixed(2)),
  };
}

/**
 * Analyzes market indicators for Smart $5 Compounding
 */
export async function evaluateCompoundingOpportunity(
  exchange: ExchangeId,
  pair: CryptoPair,
  timeframe: Timeframe,
  currentBalance: number
): Promise<CompoundingTradeRecord | null> {
  if (currentBalance < 1.0) return null;

  try {
    const klines: KlineData[] = exchange === 'binance'
      ? await fetchBinanceKlines(pair.symbol, timeframe, 50).catch(() => [])
      : await fetchBitgetKlines(pair.symbol, timeframe, 'USDT-FUTURES', 50).catch(() => []);

    if (klines.length < 30) return null;

    const closes = klines.map((k) => k.close);
    const currentPrice = closes[closes.length - 1];

    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const rsi = calculateRSI(closes, 14);
    const macdData = calculateMACD(closes, 12, 26, 9);
    const atr = calculateATR(klines, 14);
    const sr = findSupportResistance(klines, 30);

    const lastEma9 = ema9[ema9.length - 1];
    const lastEma21 = ema21[ema21.length - 1];
    const lastRsi = rsi[rsi.length - 1];
    const lastMacdHist = macdData.histogram[macdData.histogram.length - 1];
    const lastAtr = atr[atr.length - 1] || currentPrice * 0.01;

    let score = 0;
    const reasons: string[] = [];

    // Trend
    if (currentPrice > lastEma21 && lastEma9 > lastEma21) {
      score += 35;
      reasons.push('EMA 9/21 Golden Crossover Trend');
    } else if (currentPrice < lastEma21 && lastEma9 < lastEma21) {
      score += 35;
      reasons.push('EMA 9/21 Death Cross Trend');
    }

    // RSI
    if (lastRsi > 48 && lastRsi < 65) {
      score += 25;
      reasons.push(`Bullish RSI Momentum (${lastRsi.toFixed(1)})`);
    } else if (lastRsi < 52 && lastRsi > 35) {
      score += 25;
      reasons.push(`Bearish RSI Momentum (${lastRsi.toFixed(1)})`);
    }

    // MACD
    if (lastMacdHist > 0) {
      score += 25;
      reasons.push('MACD Positive Histogram');
    } else {
      score += 25;
      reasons.push('MACD Negative Histogram');
    }

    if (score < 60) return null; // High confluence threshold

    const direction: 'BUY' | 'SELL' = (lastEma9 > lastEma21 && lastRsi > 50) ? 'BUY' : 'SELL';

    // Stop Loss & Take Profit calculation
    const slDist = Math.max(lastAtr * 1.5, currentPrice * 0.012);
    const stopLoss = direction === 'BUY'
      ? parseFloat((currentPrice - slDist).toFixed(pair.pricePrecision))
      : parseFloat((currentPrice + slDist).toFixed(pair.pricePrecision));

    const takeProfit = direction === 'BUY'
      ? parseFloat((currentPrice + slDist * 2.0).toFixed(pair.pricePrecision))
      : parseFloat((currentPrice - slDist * 2.0).toFixed(pair.pricePrecision));

    const { positionSizeUsd } = calculateCompoundingPositionSize(currentBalance, 50, 3, 1.5);

    return {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      exchange,
      symbol: pair.symbol,
      displayName: pair.displayName,
      timeframe,
      direction,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      positionSizeUsd,
      startBalanceUsd: currentBalance,
      status: 'OPEN',
      confidenceScore: Math.min(95, Math.round(score * 1.1)),
      riskLevel: score > 80 ? 'LOW' : 'MEDIUM',
      reasons,
    };
  } catch {
    return null;
  }
}
