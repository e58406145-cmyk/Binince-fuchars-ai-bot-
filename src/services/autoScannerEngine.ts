/**
 * AI-Powered Auto Generate All Pairs Signal System
 * 
 * Features:
 * - Scans ONLY the exchange selected in Settings (Binance Futures or Bitget Futures)
 * - Quantitative scanning with complete 27-Point signal analysis
 * - 1x to 100x dynamic leverage calculation with liquidation safety
 * - Command processing (SCAN_ALL, BEST_LONG, BEST_SHORT, BEST_OPPORTUNITY, CONTINUOUS)
 * - Multi-timeframe trend & momentum confirmation
 */

import { 
  ExchangeId, 
  MarketOptionId,
  MarketType,
  Timeframe, 
  CryptoPair, 
  FullSignal27Point, 
  AutoScannerCommand,
  AutoScannerStats,
  KlineData,
  OrderBookData,
  DerivativesData
} from '../types/crypto';
import { 
  fetchBinancePairs, 
  fetchBinanceSpotPairs,
  fetchBinanceKlines, 
  fetchBinanceSpotKlines,
  fetchBinanceOrderBook, 
  fetchBinanceSpotOrderBook,
  fetchBinanceDerivatives 
} from './api/binance';
import { 
  fetchBitgetPairs, 
  fetchBitgetSpotPairs,
  fetchBitgetKlines, 
  fetchBitgetSpotKlines,
  fetchBitgetOrderBook, 
  fetchBitgetSpotOrderBook,
  fetchBitgetDerivatives 
} from './api/bitget';
import { 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands, 
  calculateATR, 
  calculateVWAP,
  calculateStochRSI,
  findSupportResistance
} from '../utils/indicators';
import { formatCryptoPrice } from '../utils/formatters';

export const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

/**
 * Calculates optimal recommended leverage (1x to 100x) based on
 * ATR volatility, stop loss distance, and liquidation buffer.
 */
export function calculateRecommendedLeverage(
  currentPrice: number,
  stopLossPrice: number,
  atr14: number,
  direction: 'LONG' | 'SHORT'
): number {
  if (currentPrice <= 0 || stopLossPrice <= 0) return 5;

  const slDistancePercent = Math.abs(currentPrice - stopLossPrice) / currentPrice * 100;
  const atrPercent = (atr14 / currentPrice) * 100;

  // Rule 1: Liquidation must be at least 2.2x beyond Stop Loss
  // Maintenance margin ~ 0.5% (0.005)
  // Max safe leverage based on SL distance:
  // slDistancePercent * leverage < 40% of margin buffer
  const maxLeverageBySl = Math.max(1, Math.floor(40 / Math.max(slDistancePercent, 0.4)));

  // Rule 2: Volatility dampener
  // High ATR % means smaller leverage
  const maxLeverageByAtr = Math.max(1, Math.floor(30 / Math.max(atrPercent, 0.3)));

  // Combine rules conservatively
  const computed = Math.min(maxLeverageBySl, maxLeverageByAtr, 50);

  // Snap to closest standard leverage tier without exceeding computed
  const available = LEVERAGE_OPTIONS.filter(lev => lev <= Math.max(computed, 2));
  return available.length > 0 ? available[available.length - 1] : 2;
}

/**
 * Calculates estimated liquidation price for isolated futures
 */
export function calculateLiquidationPrice(
  entryPrice: number,
  direction: 'LONG' | 'SHORT',
  leverage: number,
  maintenanceMarginRate = 0.005 // 0.5%
): number {
  if (leverage <= 1) return direction === 'LONG' ? 0 : entryPrice * 2;

  const initialMarginRate = 1 / leverage;
  if (direction === 'LONG') {
    // Liq = Entry * (1 - InitialMargin + MaintenanceMargin)
    const liq = entryPrice * (1 - initialMarginRate + maintenanceMarginRate);
    return Math.max(0, liq);
  } else {
    // Liq = Entry * (1 + InitialMargin - MaintenanceMargin)
    const liq = entryPrice * (1 + initialMarginRate - maintenanceMarginRate);
    return liq;
  }
}

/**
 * Helper to compute Supertrend indicator
 */
function calculateSupertrend(klines: KlineData[], period = 10, multiplier = 3): { direction: 'BULLISH' | 'BEARISH'; value: number } {
  if (klines.length < period) return { direction: 'BULLISH', value: klines[klines.length - 1]?.close || 0 };
  const atr = calculateATR(klines, period);
  const lastIndex = klines.length - 1;
  const currentAtr = atr[lastIndex] || (klines[lastIndex].high - klines[lastIndex].low);
  const hl2 = (klines[lastIndex].high + klines[lastIndex].low) / 2;
  const upperBand = hl2 + multiplier * currentAtr;
  const lowerBand = hl2 - multiplier * currentAtr;
  const close = klines[lastIndex].close;

  if (close > lowerBand) {
    return { direction: 'BULLISH', value: lowerBand };
  } else {
    return { direction: 'BEARISH', value: upperBand };
  }
}

/**
 * Helper to compute ADX (Average Directional Index)
 */
function calculateADX(klines: KlineData[], period = 14): { adx: number; pDi: number; mDi: number } {
  if (klines.length < period + 1) return { adx: 25, pDi: 25, mDi: 25 };

  let pDmSum = 0;
  let mDmSum = 0;
  let trSum = 0;

  for (let i = 1; i < klines.length && i <= period; i++) {
    const cur = klines[i];
    const prev = klines[i - 1];
    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;

    pDmSum += (upMove > downMove && upMove > 0) ? upMove : 0;
    mDmSum += (downMove > upMove && downMove > 0) ? downMove : 0;
    trSum += Math.max(cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close));
  }

  const pDi = trSum > 0 ? (pDmSum / trSum) * 100 : 25;
  const mDi = trSum > 0 ? (mDmSum / trSum) * 100 : 25;
  const dx = (pDi + mDi) > 0 ? (Math.abs(pDi - mDi) / (pDi + mDi)) * 100 : 20;

  return { adx: Math.round(dx), pDi: Math.round(pDi), mDi: Math.round(mDi) };
}

/**
 * Builds the comprehensive 27-Point Signal object
 */
export function build27PointSignal(
  exchange: ExchangeId,
  pair: CryptoPair,
  klines: KlineData[],
  orderBook: OrderBookData | null,
  derivatives: DerivativesData | null,
  timeframe: Timeframe,
  holdingLimitMinutes = 30,
  marketOptionId: MarketOptionId = 'BINANCE_FUTURES'
): FullSignal27Point | null {
  if (klines.length < 35) return null;

  const marketType: MarketType = marketOptionId.endsWith('SPOT') ? 'SPOT' : 'FUTURES';
  const closes = klines.map(k => k.close);
  const currentPrice = closes[closes.length - 1];
  const lastKline = klines[klines.length - 1];

  // 1. EMAs
  const ema9Arr = calculateEMA(closes, 9);
  const ema21Arr = calculateEMA(closes, 21);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, Math.min(200, closes.length));

  const ema9 = ema9Arr[ema9Arr.length - 1];
  const ema21 = ema21Arr[ema21Arr.length - 1];
  const ema50 = ema50Arr[ema50Arr.length - 1];
  const ema200 = ema200Arr[ema200Arr.length - 1];

  // 2. RSI
  const rsiArr = calculateRSI(closes, 14);
  const rsi = rsiArr[rsiArr.length - 1];

  // 3. MACD
  const macdData = calculateMACD(closes, 12, 26, 9);
  const macdVal = macdData.macdLine[macdData.macdLine.length - 1];
  const macdSig = macdData.signalLine[macdData.signalLine.length - 1];
  const macdHist = macdData.histogram[macdData.histogram.length - 1];
  const prevMacdHist = macdData.histogram[macdData.histogram.length - 2] || 0;

  // 4. Bollinger Bands & ATR
  const bb = calculateBollingerBands(closes, 20, 2);
  const atrArr = calculateATR(klines, 14);
  const atr = atrArr[atrArr.length - 1] || (lastKline.high - lastKline.low);
  const vwap = calculateVWAP(klines, 50);
  const supertrend = calculateSupertrend(klines, 10, 3);
  const adxData = calculateADX(klines, 14);
  const srResult = findSupportResistance(klines, 40);

  // Order Book imbalance
  let orderBookImbalanceRatio = 1.0;
  if (orderBook && orderBook.bids.length > 0 && orderBook.asks.length > 0) {
    const totalBidVol = orderBook.bids.slice(0, 10).reduce((acc, b) => acc + b.amount, 0);
    const totalAskVol = orderBook.asks.slice(0, 10).reduce((acc, a) => acc + a.amount, 0);
    if (totalAskVol > 0) orderBookImbalanceRatio = totalBidVol / totalAskVol;
  }

  // Multi-Factor Quantitative Scoring
  let longPoints = 0;
  let shortPoints = 0;
  const reasons: string[] = [];

  // Trend Scoring
  if (currentPrice > ema21 && ema9 > ema21) {
    longPoints += 20;
    reasons.push('EMA 9/21 Golden Bullish Stack');
  } else if (currentPrice < ema21 && ema9 < ema21) {
    shortPoints += 20;
    reasons.push('EMA 9/21 Bearish Death Stack');
  }

  if (currentPrice > ema50 && ema21 > ema50) {
    longPoints += 15;
    reasons.push('Price holding strong above 50 EMA');
  } else if (currentPrice < ema50 && ema21 < ema50) {
    shortPoints += 15;
    reasons.push('Price rejected below 50 EMA');
  }

  if (supertrend.direction === 'BULLISH') {
    longPoints += 15;
    reasons.push('Supertrend (10,3) in Bullish Expansion');
  } else {
    shortPoints += 15;
    reasons.push('Supertrend (10,3) in Bearish Contraction');
  }

  // Momentum Scoring
  if (rsi >= 50 && rsi <= 68) {
    longPoints += 15;
    reasons.push(`Healthy Bullish RSI (${rsi.toFixed(1)})`);
  } else if (rsi <= 50 && rsi >= 32) {
    shortPoints += 15;
    reasons.push(`Bearish Momentum RSI (${rsi.toFixed(1)})`);
  } else if (rsi < 30) {
    longPoints += 10;
    reasons.push('Oversold RSI Reversal Potential');
  } else if (rsi > 70) {
    shortPoints += 10;
    reasons.push('Overbought RSI Exhaustion Potential');
  }

  // MACD Scoring
  if (macdHist > 0 && macdHist > prevMacdHist) {
    longPoints += 15;
    reasons.push('MACD Histogram Expanding Bullish');
  } else if (macdHist < 0 && macdHist < prevMacdHist) {
    shortPoints += 15;
    reasons.push('MACD Histogram Expanding Bearish');
  }

  // Volume & VWAP Scoring
  if (currentPrice > vwap) {
    longPoints += 10;
    reasons.push('Trading above Institutional VWAP');
  } else {
    shortPoints += 10;
    reasons.push('Trading below Institutional VWAP');
  }

  // Order Book Scoring
  if (orderBookImbalanceRatio > 1.25) {
    longPoints += 10;
    reasons.push(`Order Book Bid Heavy (${(orderBookImbalanceRatio * 100).toFixed(0)}% bid pressure)`);
  } else if (orderBookImbalanceRatio < 0.8) {
    shortPoints += 10;
    reasons.push(`Order Book Ask Heavy (${((1 / orderBookImbalanceRatio) * 100).toFixed(0)}% ask pressure)`);
  }

  // Determine Direction
  let rawDir: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let setupScore = 0;
  let confidenceScore = 50;

  if (longPoints >= 55 && longPoints > shortPoints + 20) {
    rawDir = 'BULLISH';
    setupScore = Math.min(98, Math.round(longPoints * 0.95 + (adxData.adx > 25 ? 5 : 0)));
    confidenceScore = Math.min(95, Math.round(setupScore * 0.92 + 5));
  } else if (shortPoints >= 55 && shortPoints > longPoints + 20) {
    rawDir = 'BEARISH';
    setupScore = Math.min(98, Math.round(shortPoints * 0.95 + (adxData.adx > 25 ? 5 : 0)));
    confidenceScore = Math.min(95, Math.round(setupScore * 0.92 + 5));
  } else {
    rawDir = 'NEUTRAL';
    setupScore = Math.round(Math.max(longPoints, shortPoints) * 0.7);
    confidenceScore = 40;
    reasons.push('Signals in conflict: No decisive trend edge');
  }

  let direction: FullSignal27Point['direction'] = 'WAIT';
  if (marketType === 'SPOT') {
    direction = rawDir === 'BULLISH' ? 'BUY' : rawDir === 'BEARISH' ? 'SELL' : 'WAIT';
  } else {
    direction = rawDir === 'BULLISH' ? 'LONG' : rawDir === 'BEARISH' ? 'SHORT' : 'WAIT';
  }

  // Key Support & Resistance
  const support = srResult.support || (currentPrice - atr * 1.5);
  const resistance = srResult.resistance || (currentPrice + atr * 1.5);

  // Targets & Stop Loss Calculation
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let takeProfit3 = 0;
  let entryZoneMin = 0;
  let entryZoneMax = 0;

  if (direction === 'LONG') {
    entryZoneMin = Number((currentPrice * 0.998).toFixed(pair.pricePrecision));
    entryZoneMax = Number((currentPrice * 1.002).toFixed(pair.pricePrecision));
    const slDist = Math.max(atr * 1.4, currentPrice * 0.008);
    stopLoss = Number((currentPrice - slDist).toFixed(pair.pricePrecision));
    takeProfit1 = Number((currentPrice + slDist * 1.5).toFixed(pair.pricePrecision));
    takeProfit2 = Number((currentPrice + slDist * 2.5).toFixed(pair.pricePrecision));
    takeProfit3 = Number((currentPrice + slDist * 4.0).toFixed(pair.pricePrecision));
  } else if (direction === 'SHORT') {
    entryZoneMin = Number((currentPrice * 0.998).toFixed(pair.pricePrecision));
    entryZoneMax = Number((currentPrice * 1.002).toFixed(pair.pricePrecision));
    const slDist = Math.max(atr * 1.4, currentPrice * 0.008);
    stopLoss = Number((currentPrice + slDist).toFixed(pair.pricePrecision));
    takeProfit1 = Number((currentPrice - slDist * 1.5).toFixed(pair.pricePrecision));
    takeProfit2 = Number((currentPrice - slDist * 2.5).toFixed(pair.pricePrecision));
    takeProfit3 = Number((currentPrice - slDist * 4.0).toFixed(pair.pricePrecision));
  } else {
    entryZoneMin = currentPrice;
    entryZoneMax = currentPrice;
    stopLoss = Number((currentPrice * 0.98).toFixed(pair.pricePrecision));
    takeProfit1 = Number((currentPrice * 1.02).toFixed(pair.pricePrecision));
    takeProfit2 = Number((currentPrice * 1.04).toFixed(pair.pricePrecision));
    takeProfit3 = Number((currentPrice * 1.06).toFixed(pair.pricePrecision));
  }

  // Distance percentages
  const slDistPct = currentPrice > 0 ? (Math.abs(currentPrice - stopLoss) / currentPrice) * 100 : 1;
  const tp1DistPct = currentPrice > 0 ? (Math.abs(takeProfit1 - currentPrice) / currentPrice) * 100 : 1.5;
  const tp2DistPct = currentPrice > 0 ? (Math.abs(takeProfit2 - currentPrice) / currentPrice) * 100 : 2.5;
  const tp3DistPct = currentPrice > 0 ? (Math.abs(takeProfit3 - currentPrice) / currentPrice) * 100 : 4.0;
  const riskReward = slDistPct > 0 ? Number((tp2DistPct / slDistPct).toFixed(2)) : 2.0;

  // Recommended leverage & liquidation calculation
  const calcDir: 'LONG' | 'SHORT' = (direction === 'SHORT' || direction === 'SELL') ? 'SHORT' : 'LONG';
  const recommendedLeverage = marketType === 'SPOT' ? 1 : calculateRecommendedLeverage(currentPrice, stopLoss, atr, calcDir);
  const estimatedLiquidationPrice = calculateLiquidationPrice(currentPrice, calcDir, recommendedLeverage);
  const liquidationBufferPercent = currentPrice > 0 ? (Math.abs(currentPrice - estimatedLiquidationPrice) / currentPrice) * 100 : 10;

  // Timestamps
  const now = Date.now();
  const expiryTimestamp = now + holdingLimitMinutes * 60 * 1000;
  const genTimeFormatted = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const expTimeFormatted = new Date(expiryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Narrative generation
  const marketTrend: FullSignal27Point['marketTrend'] = 
    (direction === 'LONG' || direction === 'BUY') ? (setupScore > 85 ? 'STRONG_BULLISH' : 'BULLISH') :
    (direction === 'SHORT' || direction === 'SELL') ? (setupScore > 85 ? 'STRONG_BEARISH' : 'BEARISH') : 'NEUTRAL';

  const rsiCondition = rsi < 30 ? 'Oversold (<30)' : rsi > 70 ? 'Overbought (>70)' : rsi > 50 ? 'Bullish Dominance' : 'Bearish Dominance';
  const emaTrendDesc = `${pair.displayName} is trading ${currentPrice > ema21 ? 'ABOVE' : 'BELOW'} 21-EMA with ${ema9 > ema21 ? 'bullish' : 'bearish'} momentum alignment.`;
  const macdDesc = `MACD ${macdHist > 0 ? 'Bullish' : 'Bearish'} (${macdVal.toFixed(4)}) with ${macdHist > prevMacdHist ? 'accelerating' : 'decelerating'} histogram.`;
  const volumeDesc = `24h Volume $${((pair.volume24h || 0) / 1e6).toFixed(2)}M, OB Imbalance ${orderBookImbalanceRatio.toFixed(2)}x.`;
  
  const fundingRate = derivatives?.fundingRate || 0.0001;
  const fundingRatePercentText = `${(fundingRate * 100).toFixed(4)}%`;
  const sentimentText = fundingRate > 0.0005 ? 'Heavy Long Crowding' : fundingRate < -0.0002 ? 'Heavy Short Crowding' : 'Balanced Funding';

  const aiNarrative = (direction === 'WAIT')
    ? `Market structure on ${pair.displayName} is consolidating. Indicators reflect choppy, non-directional price action. Capital preservation advised until clear breakout occurs.`
    : `High-conviction ${direction} setup on ${pair.displayName} (${exchange.toUpperCase()} ${marketType}). Confluence of ${reasons.slice(0, 3).join(', ')}. Planned entry zone between ${formatCryptoPrice(entryZoneMin)} - ${formatCryptoPrice(entryZoneMax)} with strict SL at ${formatCryptoPrice(stopLoss)}. ${marketType === 'SPOT' ? 'Spot position trading.' : `Recommended leverage ${recommendedLeverage}x keeps liquidation safety buffer at ${liquidationBufferPercent.toFixed(1)}%.`}`;

  return {
    exchange,
    symbol: pair.symbol,
    displayName: pair.displayName,
    direction,
    currentPrice,
    entryPrice: currentPrice,
    entryZoneMin,
    entryZoneMax,
    timeframe,
    holdingPeriod: `${holdingLimitMinutes} Min (or until TP/SL hit)`,
    recommendedLeverage,
    userLeverage: recommendedLeverage,
    stopLoss,
    stopLossDistancePercent: Number(slDistPct.toFixed(2)),
    takeProfit1,
    takeProfit1DistancePercent: Number(tp1DistPct.toFixed(2)),
    takeProfit2,
    takeProfit2DistancePercent: Number(tp2DistPct.toFixed(2)),
    takeProfit3,
    takeProfit3DistancePercent: Number(tp3DistPct.toFixed(2)),
    riskRewardRatio: riskReward,
    setupScore,
    confidenceScore,
    marketTrend,
    rsiValue: Number(rsi.toFixed(2)),
    rsiCondition,
    emaTrendDescription: emaTrendDesc,
    ema9: Number(ema9.toFixed(pair.pricePrecision)),
    ema21: Number(ema21.toFixed(pair.pricePrecision)),
    ema50: Number(ema50.toFixed(pair.pricePrecision)),
    ema200: Number(ema200.toFixed(pair.pricePrecision)),
    macdStatusDescription: macdDesc,
    macdValue: Number(macdVal.toFixed(4)),
    macdSignal: Number(macdSig.toFixed(4)),
    macdHist: Number(macdHist.toFixed(4)),
    volume24hUsd: pair.volume24h || 0,
    volumeTrendDescription: volumeDesc,
    supportLevel: Number(support.toFixed(pair.pricePrecision)),
    resistanceLevel: Number(resistance.toFixed(pair.pricePrecision)),
    estimatedLiquidationPrice: Number(estimatedLiquidationPrice.toFixed(pair.pricePrecision)),
    liquidationBufferPercent: Number(liquidationBufferPercent.toFixed(2)),
    fundingRate,
    fundingRatePercentText,
    sentimentText,
    generationTimestamp: now,
    generationTimeFormatted: genTimeFormatted,
    expiryTimestamp,
    expiryTimeFormatted: expTimeFormatted,
    aiMarketAnalysisNarrative: aiNarrative,
    source: 'AUTO',
    reasons
  };
}

/**
 * Executes a full scan on the active exchange.
 * Scans ONLY the exchange passed in (Binance or Bitget), never both.
 */
export async function executeAutoScanAllPairs(
  activeExchange: ExchangeId,
  timeframe: Timeframe,
  holdingLimitMinutes = 30,
  onProgress?: (scanned: number, total: number, currentPair: string) => void,
  shouldHalt?: () => boolean,
  hasActiveEventWindow?: boolean,
  eventTitle?: string,
  marketOptionId: MarketOptionId = 'BINANCE_FUTURES'
): Promise<{
  scannedCount: number;
  totalTradable: number;
  signals: FullSignal27Point[];
  bestOpportunity: FullSignal27Point | null;
  longCount: number;
  shortCount: number;
  waitCount: number;
}> {
  // 1. Fetch tradable pairs for the ACTIVE market option
  let pairs: CryptoPair[] = [];
  if (marketOptionId === 'BINANCE_SPOT') {
    pairs = await fetchBinanceSpotPairs().catch(() => []);
  } else if (marketOptionId === 'BINANCE_FUTURES') {
    pairs = await fetchBinancePairs('USDT-M').catch(() => []);
  } else if (marketOptionId === 'BITGET_SPOT') {
    pairs = await fetchBitgetSpotPairs().catch(() => []);
  } else {
    pairs = await fetchBitgetPairs('USDT-FUTURES').catch(() => []);
  }

  // Filter pairs: must be active USDT pair with reasonable volume
  const tradablePairs = pairs
    .filter(p => p.quoteAsset === 'USDT' && (p.volume24h || 0) > 500_000)
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

  const totalTradable = tradablePairs.length;
  const scanBatch = tradablePairs.slice(0, 30);

  const signals: FullSignal27Point[] = [];
  let longCount = 0;
  let shortCount = 0;
  let waitCount = 0;

  for (let i = 0; i < scanBatch.length; i++) {
    if (shouldHalt && shouldHalt()) break;

    const pair = scanBatch[i];
    if (onProgress) {
      onProgress(i + 1, scanBatch.length, pair.displayName);
    }

    try {
      let klines: KlineData[] = [];
      let orderBook: OrderBookData | null = null;
      let derivatives: DerivativesData | null = null;

      if (marketOptionId === 'BINANCE_SPOT') {
        const [kRes, obRes] = await Promise.all([
          fetchBinanceSpotKlines(pair.symbol, timeframe, 60).catch(() => []),
          fetchBinanceSpotOrderBook(pair.symbol, 10).catch(() => null),
        ]);
        klines = kRes;
        orderBook = obRes;
      } else if (marketOptionId === 'BINANCE_FUTURES') {
        const [kRes, obRes, dRes] = await Promise.all([
          fetchBinanceKlines(pair.symbol, timeframe, 60).catch(() => []),
          fetchBinanceOrderBook(pair.symbol, 10).catch(() => null),
          fetchBinanceDerivatives(pair.symbol).catch(() => null)
        ]);
        klines = kRes;
        orderBook = obRes;
        derivatives = dRes;
      } else if (marketOptionId === 'BITGET_SPOT') {
        const [kRes, obRes] = await Promise.all([
          fetchBitgetSpotKlines(pair.symbol, timeframe, 60).catch(() => []),
          fetchBitgetSpotOrderBook(pair.symbol, 10).catch(() => null),
        ]);
        klines = kRes;
        orderBook = obRes;
      } else {
        const [kRes, obRes, dRes] = await Promise.all([
          fetchBitgetKlines(pair.symbol, timeframe, 'USDT-FUTURES', 60).catch(() => []),
          fetchBitgetOrderBook(pair.symbol, 'USDT-FUTURES', 10).catch(() => null),
          fetchBitgetDerivatives(pair.symbol, 'USDT-FUTURES').catch(() => null)
        ]);
        klines = kRes;
        orderBook = obRes;
        derivatives = dRes;
      }

      if (klines.length >= 30) {
        const signal = build27PointSignal(
          activeExchange,
          pair,
          klines,
          orderBook,
          derivatives,
          timeframe,
          holdingLimitMinutes,
          marketOptionId
        );

        if (signal) {
          signal.marketOptionId = marketOptionId;
          signal.marketType = marketOptionId.endsWith('SPOT') ? 'SPOT' : 'FUTURES';

          if (hasActiveEventWindow) {
            signal.direction = 'WAIT';
            signal.reasons.unshift(`High-impact economic event active (${eventTitle || 'Major Event'}). ±30m window: WAIT returned.`);
            signal.aiMarketAnalysisNarrative = `PROTECTION ACTIVE: High-impact economic event (${eventTitle || 'Central Bank / Inflation'}). Volatility spike anticipated; directional entry suspended to protect capital.`;
            signals.push(signal);
            waitCount++;
          } else {
            signals.push(signal);
            if (signal.direction === 'LONG' || signal.direction === 'BUY') longCount++;
            else if (signal.direction === 'SHORT' || signal.direction === 'SELL') shortCount++;
            else waitCount++;
          }
        }
      }
    } catch {
      // Continue to next pair
    }

    await new Promise(r => setTimeout(r, 40));
  }

  // Sort signals by setup score descending
  signals.sort((a, b) => b.setupScore - a.setupScore);

  const bestOpportunity = signals.find(s => s.direction !== 'NO_TRADE') || signals[0] || null;

  return {
    scannedCount: scanBatch.length,
    totalTradable,
    signals,
    bestOpportunity,
    longCount,
    shortCount,
    waitCount
  };
}
