import { 
  CryptoPair, 
  Timeframe, 
  ScannedPairResult, 
  UserSettings, 
  KlineData, 
  OrderBookData,
  DerivativesData 
} from '../types/crypto';
import { 
  fetchBinanceKlines, 
  fetchBinanceOrderBook, 
  fetchBinanceDerivatives 
} from './api/binance';
import { 
  fetchBitgetKlines, 
  fetchBitgetOrderBook, 
  fetchBitgetDerivatives 
} from './api/bitget';
import { fetchCryptoSentiment, SentimentData } from './api/news';
import { getHigherTimeframes, runComprehensiveAnalysis, AnalysisInput } from './analysisEngine';

export interface ScannerProgressCallback {
  (scannedCount: number, totalToScan: number, currentSymbol: string): void;
}

/**
 * Calculates estimated holding duration based on analysis timeframe
 */
export function getEstimatedHoldingTime(tf: Timeframe): string {
  switch (tf) {
    case '1m':
    case '3m':
    case '5m':
      return '15 - 45 mins (Scalp)';
    case '15m':
    case '30m':
      return '2 - 8 hours (Intraday)';
    case '1h':
    case '4h':
      return '1 - 3 days (Swing)';
    case '1d':
      return '1 - 2 weeks (Positional)';
    default:
      return '2 - 8 hours';
  }
}

/**
 * Executes full market scan across liquid tradable perpetual pairs
 */
export async function scanAllTradablePairs(
  allPairs: CryptoPair[],
  timeframe: Timeframe,
  settings: UserSettings,
  onProgress: ScannerProgressCallback
): Promise<ScannedPairResult[]> {
  const minVolume = settings.min24hVolumeUsd || 10_000_000;
  const maxSpread = settings.maxSpreadPercent || 0.08;

  // 1. Pre-filter by liquidity (24h volume)
  // Sort descending by volume so we prioritize most liquid contracts
  const liquidCandidates = allPairs
    .filter((p) => (p.volume24h || 0) >= minVolume)
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));

  // If very few pass strict volume (e.g. in test environment), take top 30
  const candidatePool = liquidCandidates.length >= 10 
    ? liquidCandidates.slice(0, 45) // scan top 45 liquid pairs to stay within polite API limits
    : allPairs.slice(0, 30);

  const totalCandidates = candidatePool.length;
  if (totalCandidates === 0) return [];

  const [htf1, htf2] = getHigherTimeframes(timeframe);

  // Fetch shared macro sentiment once for the batch
  const sharedSentiment: SentimentData = await fetchCryptoSentiment(
    localStorage.getItem('cyberpulse_cp_key') || undefined
  ).catch(() => ({
    score: 0,
    label: 'Neutral',
    fearAndGreedValue: 50,
    fearAndGreedClassification: 'Neutral',
    headlines: [],
  }));

  const qualifiedResults: ScannedPairResult[] = [];
  const BATCH_SIZE = 4; // 4 concurrent pairs to respect exchange rate limits

  for (let i = 0; i < candidatePool.length; i += BATCH_SIZE) {
    const batch = candidatePool.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (pair, batchIndex) => {
        const currentIndex = i + batchIndex + 1;
        onProgress(currentIndex, totalCandidates, pair.symbol);

        try {
          // Fetch base timeframe klines and orderbook
          const [baseKlines, htf1Klines, htf2Klines, orderBook, derivatives] = await Promise.all([
            pair.exchange === 'binance'
              ? fetchBinanceKlines(pair.symbol, timeframe, 80).catch(() => [] as KlineData[])
              : fetchBitgetKlines(pair.symbol, timeframe, pair.productType, 80).catch(() => [] as KlineData[]),
            pair.exchange === 'binance'
              ? fetchBinanceKlines(pair.symbol, htf1, 80).catch(() => [] as KlineData[])
              : fetchBitgetKlines(pair.symbol, htf1, pair.productType, 80).catch(() => [] as KlineData[]),
            pair.exchange === 'binance'
              ? fetchBinanceKlines(pair.symbol, htf2, 80).catch(() => [] as KlineData[])
              : fetchBitgetKlines(pair.symbol, htf2, pair.productType, 80).catch(() => [] as KlineData[]),
            pair.exchange === 'binance'
              ? fetchBinanceOrderBook(pair.symbol, 20).catch(() => ({ bids: [], asks: [], timestamp: Date.now() } as OrderBookData))
              : fetchBitgetOrderBook(pair.symbol, pair.productType, 20).catch(() => ({ bids: [], asks: [], timestamp: Date.now() } as OrderBookData)),
            pair.exchange === 'binance'
              ? fetchBinanceDerivatives(pair.symbol).catch(() => ({ fundingRate: 0.0001, openInterest: 0 } as DerivativesData))
              : fetchBitgetDerivatives(pair.symbol, pair.productType).catch(() => ({ fundingRate: 0.0001, openInterest: 0 } as DerivativesData)),
          ]);

          if (baseKlines.length < 25) return;

          // 2. Pre-filter by Spread: check bid-ask gap
          let spreadPct = 0.02;
          const bestBid = orderBook.bids[0]?.price;
          const bestAsk = orderBook.asks[0]?.price;
          if (bestBid && bestAsk && bestAsk > bestBid) {
            const mid = (bestBid + bestAsk) / 2;
            spreadPct = ((bestAsk - bestBid) / mid) * 100;
            // Reject illiquid wide-spread coins
            if (spreadPct > maxSpread) {
              return;
            }
          }

          // 3. Run analysis engine
          const analysisInput: AnalysisInput = {
            pair,
            timeframe,
            baseKlines,
            htf1Klines: htf1Klines.length > 0 ? htf1Klines : baseKlines,
            htf2Klines: htf2Klines.length > 0 ? htf2Klines : baseKlines,
            orderBook,
            derivatives,
            sentiment: sharedSentiment,
            settings,
          };

          const signal = runComprehensiveAnalysis(analysisInput);

          // Only qualify pairs that triggered LONG or SHORT (passing all Strict Mode rules if ON!)
          if (signal.signal === 'LONG' || signal.signal === 'SHORT') {
            const currentPrice = signal.entryPrice;
            const atr = signal.klineSnapshot?.atr14 || currentPrice * 0.01;

            // Compute Entry Zone
            const zoneBuffer = atr * 0.2;
            const entryZoneMin = signal.signal === 'LONG' ? currentPrice - zoneBuffer : currentPrice;
            const entryZoneMax = signal.signal === 'LONG' ? currentPrice : currentPrice + zoneBuffer;

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

            const bullishOrBearishCount = signal.signal === 'LONG' 
              ? signal.factorsSummary.bullishCount 
              : signal.factorsSummary.bearishCount;
            const agreementRatio = bullishOrBearishCount / 8;
            const agreementScoreText = `${bullishOrBearishCount}/8 Factors (${Math.round(agreementRatio * 100)}% Agreement)`;

            qualifiedResults.push({
              pair,
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
              estimatedHoldingTime: getEstimatedHoldingTime(timeframe),
              factorsFor,
              factorsAgainst,
              spreadPercent: spreadPct,
              volume24h: pair.volume24h || 0,
            });
          }
        } catch {
          // ignore single failed pair to keep scan going
        }
      })
    );

    // Polite delay between batches to respect rate limits
    if (i + BATCH_SIZE < candidatePool.length) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  // 4. Rank by Agreement Score (descending), then volume
  return qualifiedResults.sort((a, b) => {
    if (b.agreementRatio !== a.agreementRatio) {
      return b.agreementRatio - a.agreementRatio;
    }
    return (b.volume24h || 0) - (a.volume24h || 0);
  });
}
