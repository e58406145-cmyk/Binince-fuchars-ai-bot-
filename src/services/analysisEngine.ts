import { 
  CryptoPair, 
  KlineData, 
  OrderBookData, 
  DerivativesData, 
  Timeframe, 
  SignalResult, 
  SignalType, 
  FactorDetail, 
  UserSettings 
} from '../types/crypto';
import { 
  calculateEMA, 
  calculateSMA, 
  calculateRSI, 
  calculateMACD, 
  calculateStochRSI, 
  calculateBollingerBands, 
  calculateATR, 
  calculateVWAP, 
  detectCandlestickPatterns, 
  findSupportResistance 
} from '../utils/indicators';
import { SentimentData } from './api/news';

export interface AnalysisInput {
  pair: CryptoPair;
  timeframe: Timeframe;
  baseKlines: KlineData[];
  htf1Klines: KlineData[];
  htf2Klines: KlineData[];
  orderBook: OrderBookData;
  derivatives: DerivativesData;
  sentiment: SentimentData;
  settings: UserSettings;
}

export function getHigherTimeframes(tf: Timeframe): [Timeframe, Timeframe] {
  switch (tf) {
    case '1m': return ['5m', '15m'];
    case '3m': return ['15m', '1h'];
    case '5m': return ['15m', '1h'];
    case '15m': return ['1h', '4h'];
    case '30m': return ['1h', '4h'];
    case '1h': return ['4h', '1d'];
    case '4h': return ['1d', '1d'];
    case '1d': return ['1d', '1d'];
    default: return ['1h', '4h'];
  }
}

export function runComprehensiveAnalysis(input: AnalysisInput): SignalResult {
  const { pair, timeframe, baseKlines, htf1Klines, htf2Klines, orderBook, derivatives, sentiment, settings } = input;
  const factors: FactorDetail[] = [];
  const reasons: string[] = [];

  const currentPrice = baseKlines[baseKlines.length - 1]?.close || pair.lastPrice || 100;
  const closes = baseKlines.map(k => k.close);
  const volumes = baseKlines.map(k => k.volume);

  // 1. TREND FACTOR GROUP
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, Math.min(200, Math.floor(closes.length * 0.95)));

  const lastEma9 = ema9[ema9.length - 1];
  const lastEma21 = ema21[ema21.length - 1];
  const lastEma50 = ema50[ema50.length - 1];
  const lastEma200 = ema200[ema200.length - 1];

  // Higher Timeframe Trends
  const htf1Closes = htf1Klines.map(k => k.close);
  const htf1Ema21 = calculateEMA(htf1Closes, 21);
  const htf1Ema50 = calculateEMA(htf1Closes, 50);
  const htf1Bullish = (htf1Closes[htf1Closes.length - 1] || 0) > (htf1Ema21[htf1Ema21.length - 1] || 0) &&
                      (htf1Ema21[htf1Ema21.length - 1] || 0) > (htf1Ema50[htf1Ema50.length - 1] || 0);

  const htf2Closes = htf2Klines.map(k => k.close);
  const htf2Ema50 = calculateEMA(htf2Closes, 50);
  const htf2Ema200 = calculateEMA(htf2Closes, Math.min(200, Math.floor(htf2Closes.length * 0.95)));
  const htf2Bullish = (htf2Closes[htf2Closes.length - 1] || 0) > (htf2Ema50[htf2Ema50.length - 1] || 0) &&
                      (htf2Ema50[htf2Ema50.length - 1] || 0) > (htf2Ema200[htf2Ema200.length - 1] || 0);

  let trendScore = 0;
  if (currentPrice > lastEma21 && lastEma9 > lastEma21) trendScore += 35;
  if (currentPrice < lastEma21 && lastEma9 < lastEma21) trendScore -= 35;
  if (lastEma21 > lastEma50) trendScore += 25;
  if (lastEma21 < lastEma50) trendScore -= 25;
  if (htf1Bullish) trendScore += 20; else trendScore -= 20;
  if (htf2Bullish) trendScore += 20; else trendScore -= 20;

  const trendVote = trendScore >= 35 ? 'BULLISH' : (trendScore <= -35 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-trend',
    name: 'Multi-Timeframe Trend & EMAs',
    category: 'Trend',
    vote: trendVote,
    score: trendScore,
    summary: trendVote === 'BULLISH' 
      ? `Bullish alignment across EMA 9/21/50 and HTF trend confirmation` 
      : (trendVote === 'BEARISH' ? `Bearish stack below EMA 21/50 with HTF resistance` : `Ranging consolidation between EMAs`),
    metrics: {
      'EMA 9': lastEma9?.toFixed(pair.pricePrecision) || 'N/A',
      'EMA 21': lastEma21?.toFixed(pair.pricePrecision) || 'N/A',
      'EMA 50': lastEma50?.toFixed(pair.pricePrecision) || 'N/A',
      'HTF 1 Trend': htf1Bullish ? 'BULLISH' : 'BEARISH',
      'HTF 2 Trend': htf2Bullish ? 'BULLISH' : 'BEARISH',
    },
  });

  // 2. MOMENTUM FACTOR GROUP (RSI 14, MACD, StochRSI)
  const rsi = calculateRSI(closes, 14);
  const lastRsi = rsi[rsi.length - 1] || 50;
  const prevRsi = rsi[rsi.length - 2] || 50;

  const { macdLine, signalLine, histogram } = calculateMACD(closes, 12, 26, 9);
  const lastHist = histogram[histogram.length - 1] || 0;
  const prevHist = histogram[histogram.length - 2] || 0;

  const { k: stochK, d: stochD } = calculateStochRSI(rsi, 14, 3, 3);
  const lastK = stochK[stochK.length - 1] || 50;
  const lastD = stochD[stochD.length - 1] || 50;

  let momScore = 0;
  // RSI logic
  if (lastRsi > 50 && lastRsi < 70 && lastRsi >= prevRsi) momScore += 30;
  else if (lastRsi < 50 && lastRsi > 30 && lastRsi <= prevRsi) momScore -= 30;
  else if (lastRsi <= 30) momScore += 25; // oversold bounce zone
  else if (lastRsi >= 70) momScore -= 25; // overbought exhaustion zone

  // MACD logic
  if (lastHist > 0 && lastHist > prevHist) momScore += 35;
  else if (lastHist < 0 && lastHist < prevHist) momScore -= 35;

  // Stoch RSI logic
  if (lastK > lastD && lastK < 80) momScore += 35;
  else if (lastK < lastD && lastK > 20) momScore -= 35;

  const momVote = momScore >= 35 ? 'BULLISH' : (momScore <= -35 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-momentum',
    name: 'Momentum (RSI / MACD / StochRSI)',
    category: 'Momentum',
    vote: momVote,
    score: momScore,
    summary: momVote === 'BULLISH'
      ? `Accelerating upward velocity: MACD histogram positive & StochRSI expanding`
      : (momVote === 'BEARISH' ? `Downward velocity: MACD histogram negative & StochRSI declining` : `Momentum flat near equilibrium`),
    metrics: {
      'RSI (14)': lastRsi.toFixed(1),
      'MACD Hist': lastHist.toFixed(4),
      'StochRSI %K': lastK.toFixed(1),
      'StochRSI %D': lastD.toFixed(1),
    },
  });

  // 3. VOLATILITY FACTOR GROUP (Bollinger Bands & ATR)
  const { upper: bbUpper, lower: bbLower, percentB, bandWidth } = calculateBollingerBands(closes, 20, 2);
  const lastPercentB = percentB[percentB.length - 1] || 0.5;
  const lastBandWidth = bandWidth[bandWidth.length - 1] || 0.05;
  const atrs = calculateATR(baseKlines, 14);
  const lastAtr = atrs[atrs.length - 1] || (currentPrice * 0.015);
  const atrPercent = (lastAtr / currentPrice) * 100;

  let volScore = 0;
  if (lastPercentB > 0.65 && lastPercentB < 1.05) volScore += 30;
  else if (lastPercentB < 0.35 && lastPercentB > -0.05) volScore -= 30;

  // Band breakout or squeeze
  const isSqueeze = lastBandWidth < 0.03;
  if (isSqueeze) {
    volScore += (trendVote === 'BULLISH' ? 20 : (trendVote === 'BEARISH' ? -20 : 0));
  }

  const volVote = volScore >= 25 ? 'BULLISH' : (volScore <= -25 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-volatility',
    name: 'Volatility & Bollinger Regime',
    category: 'Volatility',
    vote: volVote,
    score: volScore,
    summary: isSqueeze 
      ? `Bollinger Squeeze active (${(lastBandWidth * 100).toFixed(2)}% width), primed for volatility explosion`
      : `ATR at ${lastAtr.toFixed(pair.pricePrecision)} (${atrPercent.toFixed(2)}%), healthy channel movement`,
    metrics: {
      'ATR (14)': lastAtr.toFixed(pair.pricePrecision),
      'ATR %': `${atrPercent.toFixed(2)}%`,
      'Bollinger %B': lastPercentB.toFixed(2),
      'Band Width': `${(lastBandWidth * 100).toFixed(2)}%`,
    },
  });

  // 4. VOLUME FACTOR GROUP (Volume vs 20 SMA, VWAP, Taker ratio)
  const volumeSma = calculateSMA(volumes, 20);
  const lastVol = volumes[volumes.length - 1] || 1;
  const lastVolSma = volumeSma[volumeSma.length - 1] || 1;
  const volumeRatio = lastVol / (lastVolSma || 1);
  const vwap = calculateVWAP(baseKlines, 50);

  let volumeScore = 0;
  const priceAboveVwap = currentPrice >= vwap;
  if (priceAboveVwap) volumeScore += 35; else volumeScore -= 35;

  if (volumeRatio > 1.25) {
    volumeScore += (closes[closes.length - 1] > closes[closes.length - 2] ? 35 : -35);
  } else if (volumeRatio < 0.75) {
    volumeScore = Math.round(volumeScore * 0.7); // low participation
  }

  // Taker buy/sell volume check
  const lastCandle = baseKlines[baseKlines.length - 1];
  let takerRatio = 1.0;
  if (lastCandle.takerBuyBaseVolume && lastCandle.volume) {
    const takerBuy = lastCandle.takerBuyBaseVolume;
    const takerSell = Math.max(0.0001, lastCandle.volume - takerBuy);
    takerRatio = takerBuy / takerSell;
    if (takerRatio > 1.15) volumeScore += 30;
    else if (takerRatio < 0.85) volumeScore -= 30;
  }

  const volFactorVote = volumeScore >= 35 ? 'BULLISH' : (volumeScore <= -35 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-volume',
    name: 'Volume Flow & VWAP',
    category: 'Volume',
    vote: volFactorVote,
    score: volumeScore,
    summary: volFactorVote === 'BULLISH'
      ? `Price holding firmly above VWAP with ${volumeRatio.toFixed(2)}x volume participation`
      : (volFactorVote === 'BEARISH' ? `Heavy seller distribution below VWAP with ${volumeRatio.toFixed(2)}x volume` : `Average volume rotation around VWAP`),
    metrics: {
      'Volume / 20-SMA': `${volumeRatio.toFixed(2)}x`,
      'VWAP': vwap.toFixed(pair.pricePrecision),
      'Taker Ratio': `${takerRatio.toFixed(2)}`,
    },
  });

  // 5. ORDER BOOK DEPTH FACTOR GROUP (Bid/Ask imbalance within 1% of mid)
  const bids = orderBook.bids || [];
  const asks = orderBook.asks || [];
  const depthThreshold = currentPrice * 0.01; // 1%

  let totalBidsWithin1Pct = 0;
  let totalAsksWithin1Pct = 0;

  bids.forEach(b => {
    if (Math.abs(currentPrice - b.price) <= depthThreshold) {
      totalBidsWithin1Pct += b.amount * b.price;
    }
  });

  asks.forEach(a => {
    if (Math.abs(a.price - currentPrice) <= depthThreshold) {
      totalAsksWithin1Pct += a.amount * a.price;
    }
  });

  const totalDepth = totalBidsWithin1Pct + totalAsksWithin1Pct;
  const depthImbalance = totalDepth > 0 ? (totalBidsWithin1Pct - totalAsksWithin1Pct) / totalDepth : 0;

  // As instructed: "weight low, large orders can be fake"
  const obScore = Math.round(depthImbalance * 60);
  const obVote = obScore >= 20 ? 'BULLISH' : (obScore <= -20 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-orderbook',
    name: 'Order Book Depth (1% Range)',
    category: 'OrderBook',
    vote: obVote,
    score: obScore,
    summary: `Bid/Ask depth skew ${(depthImbalance * 100).toFixed(1)}% within 1% price band (weighted conservatively)`,
    metrics: {
      'Bids ≤ 1%': `$${(totalBidsWithin1Pct / 1000).toFixed(0)}k`,
      'Asks ≤ 1%': `$${(totalAsksWithin1Pct / 1000).toFixed(0)}k`,
      'Imbalance': `${(depthImbalance * 100).toFixed(1)}%`,
    },
  });

  // 6. DERIVATIVES FACTOR GROUP (Funding rate, Open Interest, Long/Short ratio)
  const fundingRate = derivatives.fundingRate || 0.0001;
  const fundingPercent = fundingRate * 100;
  const lsRatio = derivatives.longShortRatio || 1.0;

  let derivScore = 0;
  // Extreme negative funding -> shorts crowded, squeeze UP potential
  if (fundingPercent < -0.02) derivScore += 45;
  // Extreme positive funding -> longs overcrowded, squeeze DOWN potential
  else if (fundingPercent > 0.035) derivScore -= 45;
  else if (fundingPercent >= 0 && fundingPercent <= 0.01) derivScore += 10; // healthy

  // Long/Short ratio bias
  if (lsRatio < 0.85) derivScore += 30; // crowd is short
  else if (lsRatio > 1.6) derivScore -= 30; // crowd is over-leveraged long

  const derivVote = derivScore >= 30 ? 'BULLISH' : (derivScore <= -30 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-derivatives',
    name: 'Derivatives & Positioning',
    category: 'Derivatives',
    vote: derivVote,
    score: derivScore,
    summary: fundingPercent > 0.03
      ? `Overheated long funding (${fundingPercent.toFixed(4)}%), high liquidation risk for late longs`
      : (fundingPercent < -0.015 ? `Negative funding (${fundingPercent.toFixed(4)}%), shorts vulnerable to squeeze` : `Normal funding regime (${fundingPercent.toFixed(4)}%)`),
    metrics: {
      'Funding Rate': `${fundingPercent.toFixed(4)}%`,
      'Long/Short Ratio': lsRatio.toFixed(2),
      'Open Interest': derivatives.openInterest ? derivatives.openInterest.toLocaleString() : 'Active',
    },
  });

  // 7. STRUCTURE & CANDLESTICK PATTERNS FACTOR GROUP
  const { support, resistance, recentSwingHigh, recentSwingLow } = findSupportResistance(baseKlines, 40);
  const candlePattern = detectCandlestickPatterns(baseKlines);

  let structScore = 0;
  if (candlePattern.bias === 'BULLISH') structScore += 40;
  if (candlePattern.bias === 'BEARISH') structScore -= 40;

  // Proximity to support vs resistance
  const distToSupp = Math.abs(currentPrice - support) / currentPrice;
  const distToRes = Math.abs(resistance - currentPrice) / currentPrice;
  if (distToSupp < distToRes * 0.6) structScore += 30; // near support with room to run
  if (distToRes < distToSupp * 0.6) structScore -= 30; // right against resistance

  const structVote = structScore >= 30 ? 'BULLISH' : (structScore <= -30 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-structure',
    name: 'Structure & Candlestick Pattern',
    category: 'Structure',
    vote: structVote,
    score: structScore,
    summary: `Pattern: ${candlePattern.pattern}. Support: ${support.toFixed(pair.pricePrecision)}, Resistance: ${resistance.toFixed(pair.pricePrecision)}`,
    metrics: {
      'Pattern': candlePattern.pattern,
      'Support': support.toFixed(pair.pricePrecision),
      'Resistance': resistance.toFixed(pair.pricePrecision),
    },
  });

  // 8. NEWS & MACRO SENTIMENT FACTOR GROUP
  const sentimentScore = sentiment.score || 0;
  const sentimentVote = sentimentScore >= 20 ? 'BULLISH' : (sentimentScore <= -20 ? 'BEARISH' : 'NEUTRAL');
  factors.push({
    id: 'factor-sentiment',
    name: 'News & Sentiment Pulse',
    category: 'Sentiment',
    vote: sentimentVote,
    score: sentimentScore,
    summary: `Fear & Greed Index at ${sentiment.fearAndGreedValue} (${sentiment.fearAndGreedClassification}) with ${sentiment.headlines.length} latest market catalysts`,
    metrics: {
      'Sentiment': sentiment.label,
      'Fear & Greed': `${sentiment.fearAndGreedValue}/100`,
      'Catalog': sentiment.fearAndGreedClassification,
    },
  });

  // Tally factor votes
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  factors.forEach(f => {
    if (f.vote === 'BULLISH') bullishCount++;
    else if (f.vote === 'BEARISH') bearishCount++;
    else neutralCount++;
  });

  // Calculate Entry, Stop Loss, and Targets according to Timeframe Strategy
  let stopDistance = lastAtr * 1.5;
  let strategyName = 'Intraday Trend-Following';
  let strategyDescription = 'EMA 21/50 pullback sequence confirmed by momentum oscillator alignment.';

  if (timeframe === '1m' || timeframe === '3m' || timeframe === '5m') {
    strategyName = 'High-Velocity Scalp';
    strategyDescription = 'Momentum breakout coupled with VWAP order-flow; tight ATR invalidation.';
    stopDistance = Math.max(lastAtr * 1.0, currentPrice * 0.003); // tighter ATR stop
  } else if (timeframe === '15m' || timeframe === '30m') {
    strategyName = 'Intraday Trend-Following';
    strategyDescription = 'EMA 21/50 dynamic support pullback with multi-factor confirmation.';
    stopDistance = Math.max(lastAtr * 1.5, currentPrice * 0.006);
  } else if (timeframe === '1h' || timeframe === '4h') {
    strategyName = 'Macro Swing Structure (Soros-Style)';
    strategyDescription = 'Macro thesis exploiting liquidity pools, structural boundaries and funding bias.';
    stopDistance = Math.max(lastAtr * 2.2, currentPrice * 0.012);
  } else if (timeframe === '1d') {
    strategyName = 'Positional Wyckoff Trend';
    strategyDescription = 'Multi-week regime trend tracking major institutional accumulation/distribution.';
    stopDistance = Math.max(lastAtr * 3.0, currentPrice * 0.025);
  }

  // Potential Preliminary Signal direction
  let candidateSignal: SignalType = 'NO_TRADE';
  if (bullishCount > bearishCount) candidateSignal = 'LONG';
  else if (bearishCount > bullishCount) candidateSignal = 'SHORT';

  // Calculate Stop Loss & Targets
  let stopLoss = 0;
  let target1 = 0;
  let target2 = 0;
  let target3 = 0;

  if (candidateSignal === 'LONG') {
    // In Long, SL is below current price or below recent swing low
    stopLoss = Math.min(currentPrice - stopDistance, recentSwingLow);
    const risk = currentPrice - stopLoss;
    target1 = currentPrice + risk * 1.5;
    target2 = currentPrice + risk * 2.0;
    target3 = currentPrice + risk * 3.0;
  } else {
    // In Short, SL is above current price or above recent swing high
    stopLoss = Math.max(currentPrice + stopDistance, recentSwingHigh);
    const risk = stopLoss - currentPrice;
    target1 = currentPrice - risk * 1.5;
    target2 = currentPrice - risk * 2.0;
    target3 = currentPrice - risk * 3.0;
  }

  const riskPerTrade = Math.abs(currentPrice - stopLoss);
  const rewardTarget2 = Math.abs(target2 - currentPrice);
  const riskRewardRatio = riskPerTrade > 0 ? parseFloat((rewardTarget2 / riskPerTrade).toFixed(2)) : 2.0;

  // STRICT MODE & NORMAL MODE VERIFICATION
  let finalSignal: SignalType = 'NO_TRADE';
  const strictMode = settings.strictMode !== false; // ON by default
  const requiredFactors = strictMode ? 6 : 4;
  const winningCount = candidateSignal === 'LONG' ? bullishCount : bearishCount;

  if (strictMode) {
    // Requirement 1: At least 6 factor groups agree
    const meetsFactorCount = winningCount >= requiredFactors;
    if (!meetsFactorCount) {
      reasons.push(`Factor agreement (${winningCount}/8) below Strict Mode threshold of 6+`);
    }

    // Requirement 2: 1h/4h trend agrees with the signal
    const htfAgrees = candidateSignal === 'LONG' ? (htf1Bullish || htf2Bullish) : (!htf1Bullish || !htf2Bullish);
    if (!htfAgrees) {
      reasons.push(`Macro Higher Timeframe trend opposes the ${candidateSignal} direction`);
    }

    // Requirement 3: Risk-Reward is at least 1:2
    const meetsRR = riskRewardRatio >= 2.0;
    if (!meetsRR) {
      reasons.push(`Risk/Reward ratio (1:${riskRewardRatio}) below strict 1:2.0 requirement`);
    }

    // Requirement 4: Volume is above average
    const volumeAboveAvg = volumeRatio >= 0.95;
    if (!volumeAboveAvg) {
      reasons.push(`Volume (${volumeRatio.toFixed(2)}x) is below 20-period average`);
    }

    // Requirement 5: Funding / open interest is not at an extreme against the trade
    let fundingNotExtreme = true;
    if (candidateSignal === 'LONG' && fundingPercent > 0.035) {
      fundingNotExtreme = false;
      reasons.push(`Overheated positive funding (${fundingPercent.toFixed(4)}%) penalizes longs`);
    } else if (candidateSignal === 'SHORT' && fundingPercent < -0.025) {
      fundingNotExtreme = false;
      reasons.push(`Heavily negative funding (${fundingPercent.toFixed(4)}%) invites short squeeze`);
    }

    // Timeframe-specific strict check:
    if ((timeframe === '1m' || timeframe === '3m' || timeframe === '5m')) {
      const scalpHtf15Agrees = candidateSignal === 'LONG' ? htf1Bullish : !htf1Bullish;
      if (!scalpHtf15Agrees) {
        reasons.push(`Scalp rule: Must trade exclusively in direction of 15m trend`);
      }
    }

    if (meetsFactorCount && htfAgrees && meetsRR && volumeAboveAvg && fundingNotExtreme && reasons.length === 0) {
      finalSignal = candidateSignal;
    } else {
      finalSignal = 'NO_TRADE';
    }
  } else {
    // Normal Mode
    const meetsFactorCount = winningCount >= 4;
    const meetsRR = riskRewardRatio >= settings.minRiskReward;

    if (!meetsFactorCount) {
      reasons.push(`Factor agreement (${winningCount}/8) below Normal Mode threshold of 4+`);
    }
    if (!meetsRR) {
      reasons.push(`Risk/Reward (1:${riskRewardRatio}) below threshold of 1:${settings.minRiskReward}`);
    }

    if (meetsFactorCount && meetsRR) {
      finalSignal = candidateSignal;
    } else {
      finalSignal = 'NO_TRADE';
    }
  }

  // Calculate confidence score
  const agreementRatio = (winningCount / 8);
  const confidenceScore = finalSignal === 'NO_TRADE' 
    ? Math.round(agreementRatio * 45) 
    : Math.min(98, Math.round(55 + agreementRatio * 40));

  return {
    id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    exchange: pair.exchange,
    symbol: pair.symbol,
    displayName: pair.displayName,
    timeframe,
    signal: finalSignal,
    entryPrice: currentPrice,
    stopLoss,
    targetPrice1: target1,
    targetPrice2: target2,
    targetPrice3: target3,
    riskRewardRatio,
    confidenceScore,
    factorsSummary: {
      bullishCount,
      bearishCount,
      neutralCount,
      totalFactors: 8,
      agreementRatio,
    },
    strategyName,
    strategyDescription,
    strictMode,
    reasons,
    factors,
    klineSnapshot: {
      lastClose: currentPrice,
      atr14: lastAtr,
      rsi14: lastRsi,
    },
  };
}
