import { 
  StockAsset, 
  StockSignalResult, 
  StockSignalType, 
  StockFactorDetail, 
  PricePositionGuidance, 
  PriceZone, 
  StockUserSettings 
} from '../types/stocks';
import { STOCK_MARKETS } from '../config/marketHours';

export function calculatePricePositionGuidance(
  currentPrice: number,
  supportPrice: number,
  resistancePrice: number,
  vwapPrice: number
): PricePositionGuidance {
  const range = resistancePrice - supportPrice;
  let score = 50;
  if (range > 0) {
    score = Math.round(((currentPrice - supportPrice) / range) * 100);
    score = Math.max(0, Math.min(100, score));
  }

  let zone: PriceZone = 'FAIR';
  let headline = 'Price is at fair value near VWAP';
  let guidanceText = `Price is balanced around VWAP (${vwapPrice.toFixed(2)}). Good entry zone if trend confirms.`;

  if (score >= 80) {
    zone = 'HIGH';
    headline = 'Price is near major resistance (Overextended)';
    guidanceText = `Price is near resistance (${resistancePrice.toFixed(2)}). Wait for pullback to ${vwapPrice.toFixed(2)} before buying. Buying here has poor risk-reward.`;
  } else if (score >= 60) {
    zone = 'UPPER-MID';
    headline = 'Price is in upper-mid range';
    guidanceText = `Price is above VWAP with upward momentum. Watch for continuation or shallow retest of ${vwapPrice.toFixed(2)}.`;
  } else if (score <= 20) {
    zone = 'LOW';
    headline = 'Price is near major support (Oversold)';
    guidanceText = `Price is near major support (${supportPrice.toFixed(2)}). Look for reversal confirmation before entering; avoid catching falling knives.`;
  } else if (score <= 40) {
    zone = 'LOWER-MID';
    headline = 'Price is in lower-mid discount zone';
    guidanceText = `Price is trading below VWAP (${vwapPrice.toFixed(2)}) near support. Favorable risk-reward for long setups if support holds.`;
  }

  return {
    zone,
    score,
    currentPrice,
    fairValuePrice: vwapPrice,
    supportPrice,
    resistancePrice,
    headline,
    guidanceText,
    disclaimer: 'This is technical position guidance, not a command to buy or sell.'
  };
}

export function analyzeStock(
  stock: StockAsset,
  settings: StockUserSettings,
  marketTiming?: {
    isObservationPeriod?: boolean;
    isSquareOffZone?: boolean;
    minutesToClose?: number;
  }
): StockSignalResult {
  const factors: StockFactorDetail[] = [];
  const marketInfo = STOCK_MARKETS[stock.market];
  const p = stock.currentPrice;

  // 1. Synthetic Technical Levels
  const vwap = Number((stock.openPrice * 0.3 + stock.highPrice * 0.3 + stock.lowPrice * 0.2 + p * 0.2).toFixed(2));
  const ema9 = Number((p * 0.995 + stock.openPrice * 0.005).toFixed(2));
  const ema21 = Number((p * 0.985 + stock.previousClose * 0.015).toFixed(2));
  const ema50 = Number((p * 0.970 + stock.low52w * 0.03).toFixed(2));
  const ema200 = Number((p * 0.940 + stock.low52w * 0.06).toFixed(2));

  const atr = Number(Math.max((stock.highPrice - stock.lowPrice), p * 0.015).toFixed(2));
  const rsi = Number(Math.min(85, Math.max(25, 50 + (stock.changePercent24h * 5))).toFixed(1));
  const rvol = stock.rvol;

  const supportPrice = Number((stock.lowPrice - atr * 0.5).toFixed(2));
  const resistancePrice = Number((stock.highPrice + atr * 0.6).toFixed(2));

  // Benchmark index simulation (generally aligned or slightly positive)
  const indexChangePercent = Number((Math.sin(p) * 0.8 + 0.3).toFixed(2));
  const indexTrend = indexChangePercent >= 0.1 ? 'BULLISH' : indexChangePercent <= -0.4 ? 'BEARISH' : 'NEUTRAL';

  // Gap Analysis
  const gapPercent = Number((((stock.openPrice - stock.previousClose) / stock.previousClose) * 100).toFixed(2));
  const isGapUp = gapPercent >= 0.5;
  const isGapDown = gapPercent <= -0.5;

  // Factor 1: EMA Ribbon Alignment
  const isEmaBullish = p > ema9 && ema9 > ema21 && ema21 > ema50;
  const isEmaBearish = p < ema9 && ema9 < ema21;
  factors.push({
    id: 'f_ema_ribbon',
    name: 'EMA Ribbon Alignment (9/21/50/200)',
    category: 'Trend',
    vote: isEmaBullish ? 'BULLISH' : isEmaBearish ? 'BEARISH' : 'NEUTRAL',
    score: isEmaBullish ? 80 : isEmaBearish ? -75 : 10,
    summary: isEmaBullish ? 'Bullish stack: Price > 9 EMA > 21 EMA > 50 EMA' : isEmaBearish ? 'Bearish stack: Price below descending EMAs' : 'EMAs compressing, no clean trend',
    metrics: { '9 EMA': ema9, '21 EMA': ema21, '50 EMA': ema50, '200 EMA': ema200 }
  });

  // Factor 2: Intraday VWAP Position
  const isVwapBullish = p >= vwap;
  factors.push({
    id: 'f_vwap',
    name: 'VWAP Intraday Anchor',
    category: 'Trend',
    vote: isVwapBullish ? 'BULLISH' : 'BEARISH',
    score: isVwapBullish ? 75 : -70,
    summary: isVwapBullish ? `Price (${p}) trading above VWAP (${vwap}), institutional buyers in control` : `Price (${p}) trading below VWAP (${vwap}), sellers defending highs`,
    metrics: { VWAP: vwap, 'Diff %': `${(((p - vwap) / vwap) * 100).toFixed(2)}%` }
  });

  // Factor 3: Opening Range Breakout (ORB)
  const isOrbBullish = p > stock.openPrice && p >= (stock.highPrice - atr * 0.2);
  const isOrbBearish = p < stock.openPrice && p <= (stock.lowPrice + atr * 0.2);
  factors.push({
    id: 'f_orb',
    name: 'Opening Range Breakout (ORB)',
    category: 'Trend',
    vote: isOrbBullish ? 'BULLISH' : isOrbBearish ? 'BEARISH' : 'NEUTRAL',
    score: isOrbBullish ? 70 : isOrbBearish ? -65 : 0,
    summary: isOrbBullish ? 'Price breaking above morning opening range with strength' : isOrbBearish ? 'Price breakdown below morning opening low' : 'Inside opening range, awaiting breakout',
    metrics: { 'Open': stock.openPrice, 'Session High': stock.highPrice, 'Session Low': stock.lowPrice }
  });

  // Factor 4: Gap Analysis
  factors.push({
    id: 'f_gap',
    name: 'Gap Analysis & Fill Probability',
    category: 'Structure',
    vote: isGapUp ? 'BULLISH' : isGapDown ? 'BEARISH' : 'NEUTRAL',
    score: isGapUp ? 65 : isGapDown ? -60 : 15,
    summary: isGapUp ? `Gap up +${gapPercent}% holding above previous close (${stock.previousClose})` : isGapDown ? `Gap down ${gapPercent}% showing opening supply pressure` : 'Flat open near previous close',
    metrics: { 'Gap %': `${gapPercent}%`, 'Prev Close': stock.previousClose }
  });

  // Factor 5: Momentum (RSI 14 & Stoch)
  const isRsiBullish = rsi >= 52 && rsi <= 68; // Healthy trending momentum, not yet overbought
  const isRsiOverbought = rsi > 70;
  const isRsiOversold = rsi < 35;
  factors.push({
    id: 'f_rsi',
    name: 'RSI (14) Momentum',
    category: 'Momentum',
    vote: isRsiBullish ? 'BULLISH' : isRsiOverbought ? 'NEUTRAL' : isRsiOversold ? 'NEUTRAL' : 'BEARISH',
    score: isRsiBullish ? 75 : isRsiOverbought ? -30 : isRsiOversold ? 40 : -50,
    summary: isRsiBullish ? `Healthy momentum at ${rsi}, room to run before overbought` : isRsiOverbought ? `Overbought at ${rsi}, extended risk of pullback` : isRsiOversold ? `Oversold at ${rsi}, potential bounce zone` : `Weak momentum at ${rsi}`,
    metrics: { 'RSI': rsi }
  });

  // Factor 6: Relative Volume (RVOL)
  const isRvolValid = rvol >= 1.2;
  factors.push({
    id: 'f_rvol',
    name: 'Relative Volume (RVOL)',
    category: 'Volume',
    vote: isRvolValid ? 'BULLISH' : 'BEARISH',
    score: isRvolValid ? 85 : -60,
    summary: isRvolValid ? `Strong institutional participation: RVOL ${rvol}x (>1.2x threshold)` : `Below threshold: RVOL ${rvol}x (<1.2x required for valid setups)`,
    metrics: { RVOL: `${rvol}x`, 'Current Vol': stock.volume, '20d Avg': stock.avgVolume20d }
  });

  // Factor 7: Benchmark Index Alignment
  const isIndexAligned = indexTrend === 'BULLISH';
  factors.push({
    id: 'f_index',
    name: `Benchmark Alignment (${marketInfo.benchmarkName})`,
    category: 'IndexContext',
    vote: indexTrend,
    score: isIndexAligned ? 70 : indexTrend === 'BEARISH' ? -70 : 10,
    summary: isIndexAligned ? `${marketInfo.benchmarkName} is up +${indexChangePercent}%, market tailwind` : indexTrend === 'BEARISH' ? `${marketInfo.benchmarkName} dumping ${indexChangePercent}%, headwind risk` : `${marketInfo.benchmarkName} consolidating`,
    metrics: { 'Index': marketInfo.benchmarkName, 'Change %': `${indexChangePercent}%` }
  });

  // Factor 8: 52-Week High / Low Proximity
  const distFrom52wHigh = Number((((stock.high52w - p) / stock.high52w) * 100).toFixed(1));
  const isNear52wHigh = distFrom52wHigh <= 10;
  factors.push({
    id: 'f_52w',
    name: '52-Week Structural Proximity',
    category: 'Structure',
    vote: isNear52wHigh ? 'BULLISH' : 'NEUTRAL',
    score: isNear52wHigh ? 75 : 20,
    summary: isNear52wHigh ? `Trading within ${distFrom52wHigh}% of 52-week high ($${stock.high52w}) - leader stock` : `Consolidating mid-range ($${stock.low52w} - $${stock.high52w})`,
    metrics: { '52w High': stock.high52w, '52w Low': stock.low52w, 'Distance from High': `${distFrom52wHigh}%` }
  });

  // Factor 9: Earnings Risk Check
  const daysToEarnings = stock.daysToEarnings ?? 30;
  const isEarningsImminent = daysToEarnings <= 3;
  factors.push({
    id: 'f_earnings',
    name: 'Earnings Proximity Risk',
    category: 'EarningsRisk',
    vote: isEarningsImminent ? 'BEARISH' : 'BULLISH',
    score: isEarningsImminent ? -90 : 80,
    summary: isEarningsImminent ? `⚠️ Earnings in ${daysToEarnings} day(s) (${stock.nextEarningsDate}). High binary event risk!` : `Safe earnings window: ${daysToEarnings} days until ${stock.nextEarningsDate}`,
    metrics: { 'Days Left': daysToEarnings, 'Date': stock.nextEarningsDate || 'N/A' }
  });

  // Summarize factors
  const bullishCount = factors.filter(f => f.vote === 'BULLISH').length;
  const bearishCount = factors.filter(f => f.vote === 'BEARISH').length;
  const neutralCount = factors.filter(f => f.vote === 'NEUTRAL').length;

  const topFactorsFor = factors.filter(f => f.vote === 'BULLISH').map(f => f.name);
  const topFactorsAgainst = factors.filter(f => f.vote === 'BEARISH').map(f => f.name);

  // Calculate Agreement Score (0 - 100)
  // 9 total factors: agreement score reflects degree of factor alignment
  let agreementScore = Math.round((bullishCount / factors.length) * 100);
  if (isEarningsImminent) {
    agreementScore = Math.max(10, agreementScore - 25);
  }

  // Price Zone Guidance
  const pricePosition = calculatePricePositionGuidance(p, supportPrice, resistancePrice, vwap);

  // Trade Plan Construction
  // Entry Zone
  const entryZoneMin = Number((Math.min(p, vwap)).toFixed(2));
  const entryZoneMax = Number((p).toFixed(2));

  // Stop loss below VWAP and session low
  const stopLoss = Number((Math.min(stock.lowPrice, vwap) - atr * 0.4).toFixed(2));
  const stopLossDist = Math.max(0.01, p - stopLoss);
  const stopLossPercent = Number(((stopLossDist / p) * 100).toFixed(2));
  const stopLossReason = `Below VWAP (${vwap}) and today's low (${stock.lowPrice}), risk: ${stopLossPercent}%`;

  // Targets based on 1:1.5 and 1:2.5
  const targetPrice1 = Number((p + stopLossDist * 1.5).toFixed(2));
  const targetPrice2 = Number((p + stopLossDist * 2.5).toFixed(2));
  const targetPrice3 = Number((p + stopLossDist * 3.5).toFixed(2));
  const riskRewardRatio = Number(((targetPrice2 - p) / stopLossDist).toFixed(2));

  // Strict Mode Evaluation
  // 1) >= 6 factors aligned
  // 2) R:R >= 1:2
  // 3) RVOL > 1.2
  // 4) Not within 15 min of open (unless ORB setup)
  // 5) Not within 30 min of close
  // 6) Index aligned
  // 7) No earnings within 3 days
  const strictReasons: string[] = [];

  if (bullishCount < 6) {
    strictReasons.push(`Requires at least 6 aligned factors (currently ${bullishCount})`);
  }
  if (riskRewardRatio < 2.0) {
    strictReasons.push(`Risk/Reward is 1:${riskRewardRatio} (< 1:2.0 required)`);
  }
  if (!isRvolValid) {
    strictReasons.push(`RVOL is ${rvol}x (< 1.2x minimum threshold)`);
  }
  if (marketTiming?.isObservationPeriod && !isOrbBullish) {
    strictReasons.push('Observing opening volatility window (first 15m) without confirmed ORB setup');
  }
  if (marketTiming?.isSquareOffZone) {
    strictReasons.push('Within 30m of market close - auto square-off zone');
  }
  if (indexTrend === 'BEARISH') {
    strictReasons.push(`Benchmark index (${marketInfo.benchmarkName}) is trending down`);
  }
  if (isEarningsImminent) {
    strictReasons.push(`Earnings report due in ${daysToEarnings} day(s) - binary volatility risk`);
  }

  const passedStrictMode = strictReasons.length === 0;

  // Determine Signal Type
  let signal: StockSignalType = 'WAIT';
  if (passedStrictMode && bullishCount >= 6) {
    signal = 'BUY';
  } else if (settings.enableShortSelling && bearishCount >= 6 && !marketTiming?.isSquareOffZone) {
    signal = 'SELL';
  } else {
    signal = 'WAIT';
  }

  // Time Window & Holding Time recommendations
  const suggestedBuyTime = `Best entry window: 10:15 - 11:30 AM (${marketInfo.currency})`;
  const estimatedHoldingTime = `Intraday (exit before ${marketInfo.regularClose}) or Swing (1-3 days)`;

  return {
    id: `stock_${stock.ticker}_${Date.now()}`,
    timestamp: Date.now(),
    market: stock.market,
    ticker: stock.ticker,
    companyName: stock.name,
    sector: stock.sector,
    currency: stock.currency,
    currencySymbol: stock.currencySymbol,
    signal,
    entryPrice: p,
    entryZone: { min: entryZoneMin, max: entryZoneMax },
    stopLoss,
    stopLossReason,
    stopLossPercent,
    targetPrice1,
    targetPrice2,
    targetPrice3,
    riskRewardRatio,
    agreementScore,
    timeframe: '15m',
    suggestedBuyTime,
    estimatedHoldingTime,
    validUntil: `End of Session (${marketInfo.regularClose})`,
    validDurationMinutes: 60,
    passedStrictMode,
    strictModeReasons: strictReasons,
    earningsWarning: isEarningsImminent ? {
      earningsDate: stock.nextEarningsDate || '',
      daysLeft: daysToEarnings,
      warningText: `Earnings in ${daysToEarnings} day(s) - high binary risk. Signals restricted.`
    } : undefined,
    pricePosition,
    factors,
    factorsSummary: {
      bullishCount,
      bearishCount,
      neutralCount,
      totalFactors: factors.length,
      topFactorsFor,
      topFactorsAgainst
    },
    rvol,
    benchmarkContext: {
      indexSymbol: marketInfo.benchmarkIndex,
      indexTrend,
      indexChangePercent
    },
    isDelayedData: true
  };
}
