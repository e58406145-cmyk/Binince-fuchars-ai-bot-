import { KlineData } from '../types/crypto';

/**
 * Calculates Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      // Initialize with SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      prevEma = sum / period;
      result.push(prevEma);
    } else {
      const val: number = data[i] * k + (prevEma as number) * (1 - k);
      prevEma = val;
      result.push(val);
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const result: number[] = [];
  if (closes.length < period + 1) return closes.map(() => 50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(50);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    } else {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  return result;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(0);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (isNaN(signalLine[i])) {
      histogram.push(0);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Stochastic RSI (%K, %D)
 */
export function calculateStochRSI(
  rsiValues: number[],
  period = 14,
  smoothK = 3,
  smoothD = 3
): { k: number[]; d: number[] } {
  const stochValues: number[] = [];

  for (let i = 0; i < rsiValues.length; i++) {
    if (i < period - 1) {
      stochValues.push(50);
    } else {
      let minRsi = Infinity;
      let maxRsi = -Infinity;
      for (let j = 0; j < period; j++) {
        const val = rsiValues[i - j];
        if (val < minRsi) minRsi = val;
        if (val > maxRsi) maxRsi = val;
      }
      const range = maxRsi - minRsi;
      const stoch = range === 0 ? 50 : ((rsiValues[i] - minRsi) / range) * 100;
      stochValues.push(stoch);
    }
  }

  const k = calculateSMA(stochValues, smoothK).map(v => isNaN(v) ? 50 : v);
  const d = calculateSMA(k, smoothD).map(v => isNaN(v) ? 50 : v);

  return { k, d };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number[]; middle: number[]; lower: number[]; percentB: number[]; bandWidth: number[] } {
  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const percentB: number[] = [];
  const bandWidth: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || isNaN(middle[i])) {
      upper.push(closes[i]);
      lower.push(closes[i]);
      percentB.push(0.5);
      bandWidth.push(0);
    } else {
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(closes[i - j] - middle[i], 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      const u = middle[i] + stdDevMultiplier * stdDev;
      const l = middle[i] - stdDevMultiplier * stdDev;
      const width = middle[i] !== 0 ? (u - l) / middle[i] : 0;
      const pb = (u - l) !== 0 ? (closes[i] - l) / (u - l) : 0.5;

      upper.push(u);
      lower.push(l);
      percentB.push(pb);
      bandWidth.push(width);
    }
  }

  return { upper, middle, lower, percentB, bandWidth };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(klines: KlineData[], period = 14): number[] {
  if (klines.length === 0) return [];
  const tr: number[] = [klines[0].high - klines[0].low];

  for (let i = 1; i < klines.length; i++) {
    const cur = klines[i];
    const prevClose = klines[i - 1].close;
    const trueRange = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prevClose),
      Math.abs(cur.low - prevClose)
    );
    tr.push(trueRange);
  }

  const atr: number[] = [];
  let sum = 0;
  for (let i = 0; i < period && i < tr.length; i++) {
    sum += tr[i];
  }
  let prevAtr = sum / Math.min(period, tr.length);

  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      atr.push(tr[i]);
    } else if (i === period - 1) {
      atr.push(prevAtr);
    } else {
      prevAtr = (prevAtr * (period - 1) + tr[i]) / period;
      atr.push(prevAtr);
    }
  }

  return atr;
}

/**
 * Calculates VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(klines: KlineData[], lookback = 50): number {
  const slice = klines.slice(-lookback);
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (const k of slice) {
    const typicalPrice = (k.high + k.low + k.close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * k.volume;
    cumulativeVolume += k.volume;
  }

  return cumulativeVolume > 0 ? cumulativeTypicalPriceVolume / cumulativeVolume : (klines[klines.length - 1]?.close || 0);
}

/**
 * Detects Candlestick Patterns on last 3 candles
 */
export function detectCandlestickPatterns(klines: KlineData[]): {
  pattern: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
} {
  if (klines.length < 3) {
    return { pattern: 'None', bias: 'NEUTRAL', description: 'Insufficient candle data' };
  }

  const c0 = klines[klines.length - 1]; // current candle
  const c1 = klines[klines.length - 2]; // previous candle
  const c2 = klines[klines.length - 3]; // candle before

  const body0 = Math.abs(c0.close - c0.open);
  const range0 = c0.high - c0.low || 0.0001;
  const upperWick0 = c0.high - Math.max(c0.close, c0.open);
  const lowerWick0 = Math.min(c0.close, c0.open) - c0.low;

  const body1 = Math.abs(c1.close - c1.open);

  const isGreen0 = c0.close > c0.open;
  const isRed1 = c1.close < c1.open;
  const isGreen1 = c1.close > c1.open;

  // 1. Bullish Engulfing
  if (isGreen0 && isRed1 && c0.open <= c1.close && c0.close >= c1.open && body0 > body1) {
    return {
      pattern: 'Bullish Engulfing',
      bias: 'BULLISH',
      description: 'Strong buyer takeover consuming preceding bearish candle',
    };
  }

  // 2. Bearish Engulfing
  if (!isGreen0 && isGreen1 && c0.open >= c1.close && c0.close <= c1.open && body0 > body1) {
    return {
      pattern: 'Bearish Engulfing',
      bias: 'BEARISH',
      description: 'Aggressive seller absorption engulfing preceding bullish candle',
    };
  }

  // 3. Hammer / Bullish Pin Bar (lower wick at least 2x body, tiny upper wick)
  if (lowerWick0 >= 2 * body0 && upperWick0 <= 0.2 * range0 && range0 > 0) {
    return {
      pattern: 'Bullish Hammer / Pin Bar',
      bias: 'BULLISH',
      description: 'Long lower shadow reveals severe rejection of lower prices',
    };
  }

  // 4. Shooting Star / Bearish Pin Bar (upper wick at least 2x body, tiny lower wick)
  if (upperWick0 >= 2 * body0 && lowerWick0 <= 0.2 * range0 && range0 > 0) {
    return {
      pattern: 'Bearish Shooting Star',
      bias: 'BEARISH',
      description: 'Long upper rejection shadow indicates seller exhaustion of the highs',
    };
  }

  // 5. Morning Star (Bullish reversal 3-candle)
  if (c2.close < c2.open && body1 < body0 * 0.4 && isGreen0 && c0.close > (c2.open + c2.close) / 2) {
    return {
      pattern: 'Morning Star',
      bias: 'BULLISH',
      description: 'Classic 3-candle reversal confirming bottom exhaustion and recovery',
    };
  }

  // 6. Evening Star (Bearish reversal 3-candle)
  if (c2.close > c2.open && body1 < body0 * 0.4 && !isGreen0 && c0.close < (c2.open + c2.close) / 2) {
    return {
      pattern: 'Evening Star',
      bias: 'BEARISH',
      description: 'Classic 3-candle top reversal confirming buyer exhaustion at peak',
    };
  }

  // 7. Doji (Indecision)
  if (body0 / range0 < 0.1) {
    return {
      pattern: 'Doji (Equilibrium)',
      bias: 'NEUTRAL',
      description: 'Tight body indicates battle at parity between bulls and bears',
    };
  }

  return {
    pattern: isGreen0 ? 'Bullish Drift' : 'Bearish Drift',
    bias: isGreen0 ? 'BULLISH' : 'BEARISH',
    description: isGreen0 ? 'Order-flow leaning positive' : 'Order-flow leaning negative',
  };
}

/**
 * Finds Swing Highs and Swing Lows for Key Support & Resistance Levels
 */
export function findSupportResistance(klines: KlineData[], lookback = 40): {
  support: number;
  resistance: number;
  recentSwingHigh: number;
  recentSwingLow: number;
} {
  const slice = klines.slice(-lookback);
  let highest = -Infinity;
  let lowest = Infinity;

  slice.forEach((k) => {
    if (k.high > highest) highest = k.high;
    if (k.low < lowest) lowest = k.low;
  });

  const cur = klines[klines.length - 1].close;
  
  // Find closest levels
  const recentSwingHigh = highest;
  const recentSwingLow = lowest;

  // Compute cluster support/resistance
  const support = Math.min(recentSwingLow, cur * 0.985);
  const resistance = Math.max(recentSwingHigh, cur * 1.015);

  return { support, resistance, recentSwingHigh, recentSwingLow };
}
