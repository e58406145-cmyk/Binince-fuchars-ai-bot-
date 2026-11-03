import { CryptoPair, KlineData, OrderBookData, DerivativesData, Timeframe } from '../../types/crypto';
import { fetchWithFallback } from './fetchHelper';

// Interval mapping for Binance
export const BINANCE_TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

interface BinanceExchangeInfoSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  contractType?: string;
  pricePrecision: number;
  quantityPrecision: number;
}

interface Binance24hTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  volume: string;
  highPrice: string;
  lowPrice: string;
}

export async function fetchBinanceSpotPairs(): Promise<CryptoPair[]> {
  const baseUrl = 'https://api.binance.com';
  const proxyPrefix = '/api/binance-spot';

  const [exchangeInfo, tickers24h] = await Promise.all([
    fetchWithFallback<{ symbols: BinanceExchangeInfoSymbol[] }>(
      `${baseUrl}/api/v3/exchangeInfo`,
      `${proxyPrefix}/api/v3/exchangeInfo`
    ).catch(() => ({ symbols: [] as BinanceExchangeInfoSymbol[] })),
    fetchWithFallback<Binance24hTicker[]>(
      `${baseUrl}/api/v3/ticker/24hr`,
      `${proxyPrefix}/api/v3/ticker/24hr`
    ).catch(() => [] as Binance24hTicker[]),
  ]);

  const tickerMap = new Map<string, Binance24hTicker>();
  if (Array.isArray(tickers24h)) {
    tickers24h.forEach((t) => tickerMap.set(t.symbol, t));
  }

  const rawSymbols = exchangeInfo.symbols || [];
  const tradingSymbols = rawSymbols.filter((s) => s.status === 'TRADING' && (s.quoteAsset === 'USDT' || s.quoteAsset === 'USDC'));

  return tradingSymbols.map((s) => {
    const ticker = tickerMap.get(s.symbol);
    const volume24h = ticker ? parseFloat(ticker.quoteVolume) || 0 : 0;
    const lastPrice = ticker ? parseFloat(ticker.lastPrice) || 0 : 0;
    const priceChange = ticker ? parseFloat(ticker.priceChangePercent) || 0 : 0;

    return {
      symbol: s.symbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      displayName: `${s.baseAsset}/${s.quoteAsset}`,
      exchange: 'binance' as const,
      productType: 'SPOT' as const,
      pricePrecision: s.pricePrecision || 2,
      quantityPrecision: s.quantityPrecision || 3,
      status: s.status,
      volume24h,
      lastPrice,
      priceChangePercent24h: priceChange,
    };
  }).sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
}

export async function fetchBinanceSpotKlines(symbol: string, timeframe: Timeframe, limit = 120): Promise<KlineData[]> {
  const interval = BINANCE_TIMEFRAME_MAP[timeframe] || '15m';
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const proxy = `/api/binance-spot/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const raw = await fetchWithFallback<any[][]>(url, proxy);
  if (!Array.isArray(raw)) return [];

  return raw.map((k) => ({
    time: Number(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[7]),
    takerBuyBaseVolume: parseFloat(k[9]),
    takerBuyQuoteVolume: parseFloat(k[10]),
    trades: Number(k[8]),
  }));
}

export async function fetchBinanceSpotOrderBook(symbol: string, limit = 50): Promise<OrderBookData> {
  const url = `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;
  const proxy = `/api/binance-spot/api/v3/depth?symbol=${symbol}&limit=${limit}`;

  const data = await fetchWithFallback<{ lastUpdateId: number; bids: [string, string][]; asks: [string, string][] }>(url, proxy);
  return {
    timestamp: Date.now(),
    lastUpdateId: data.lastUpdateId,
    bids: (data.bids || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
    asks: (data.asks || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
  };
}

export async function fetchBinancePairs(productType: 'USDT-M' | 'COIN-M' = 'USDT-M'): Promise<CryptoPair[]> {
  const isUsdtM = productType === 'USDT-M';
  const baseUrl = isUsdtM ? 'https://fapi.binance.com' : 'https://dapi.binance.com';
  const proxyPrefix = isUsdtM ? '/api/binance-fapi' : '/api/binance-dapi';

  const exchangeInfoPath = isUsdtM ? '/fapi/v1/exchangeInfo' : '/dapi/v1/exchangeInfo';
  const ticker24hPath = isUsdtM ? '/fapi/v1/ticker/24hr' : '/dapi/v1/ticker/24hr';

  // Fetch exchange info and 24h tickers in parallel
  const [exchangeInfo, tickers24h] = await Promise.all([
    fetchWithFallback<{ symbols: BinanceExchangeInfoSymbol[] }>(
      `${baseUrl}${exchangeInfoPath}`,
      `${proxyPrefix}${exchangeInfoPath}`
    ).catch(() => ({ symbols: [] as BinanceExchangeInfoSymbol[] })),
    fetchWithFallback<Binance24hTicker[]>(
      `${baseUrl}${ticker24hPath}`,
      `${proxyPrefix}${ticker24hPath}`
    ).catch(() => [] as Binance24hTicker[]),
  ]);

  const tickerMap = new Map<string, Binance24hTicker>();
  if (Array.isArray(tickers24h)) {
    tickers24h.forEach((t) => tickerMap.set(t.symbol, t));
  }

  const rawSymbols = exchangeInfo.symbols || [];
  const tradingSymbols = rawSymbols.filter((s) => {
    const isPerpetual = !s.contractType || s.contractType === 'PERPETUAL';
    const isTrading = s.status === 'TRADING';
    const quoteMatches = isUsdtM ? (s.quoteAsset === 'USDT' || s.quoteAsset === 'USDC') : true;
    return isTrading && isPerpetual && quoteMatches;
  });

  return tradingSymbols.map((s) => {
    const ticker = tickerMap.get(s.symbol);
    const volume24h = ticker ? parseFloat(ticker.quoteVolume) || 0 : 0;
    const lastPrice = ticker ? parseFloat(ticker.lastPrice) || 0 : 0;
    const priceChange = ticker ? parseFloat(ticker.priceChangePercent) || 0 : 0;

    return {
      symbol: s.symbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      displayName: `${s.baseAsset}/${s.quoteAsset}`,
      exchange: 'binance' as const,
      productType,
      pricePrecision: s.pricePrecision || 2,
      quantityPrecision: s.quantityPrecision || 3,
      status: s.status,
      volume24h,
      lastPrice,
      priceChangePercent24h: priceChange,
    };
  }).sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
}

export async function fetchBinanceKlines(symbol: string, timeframe: Timeframe, limit = 120): Promise<KlineData[]> {
  const interval = BINANCE_TIMEFRAME_MAP[timeframe] || '15m';
  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const proxy = `/api/binance-fapi/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const raw = await fetchWithFallback<any[][]>(url, proxy);
  if (!Array.isArray(raw)) return [];

  return raw.map((k) => ({
    time: Number(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[7]),
    takerBuyBaseVolume: parseFloat(k[9]),
    takerBuyQuoteVolume: parseFloat(k[10]),
    trades: Number(k[8]),
  }));
}

export async function fetchBinanceOrderBook(symbol: string, limit = 50): Promise<OrderBookData> {
  const url = `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;
  const proxy = `/api/binance-fapi/fapi/v1/depth?symbol=${symbol}&limit=${limit}`;

  const data = await fetchWithFallback<{ lastUpdateId: number; bids: [string, string][]; asks: [string, string][] }>(url, proxy);
  return {
    timestamp: Date.now(),
    lastUpdateId: data.lastUpdateId,
    bids: (data.bids || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
    asks: (data.asks || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
  };
}

export async function fetchBinanceDerivatives(symbol: string): Promise<DerivativesData> {
  const premUrl = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`;
  const premProxy = `/api/binance-fapi/fapi/v1/premiumIndex?symbol=${symbol}`;

  const oiUrl = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`;
  const oiProxy = `/api/binance-fapi/fapi/v1/openInterest?symbol=${symbol}`;

  const ratioUrl = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`;
  const ratioProxy = `/api/binance-fapi/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`;

  const [prem, oi, ratioList] = await Promise.all([
    fetchWithFallback<any>(premUrl, premProxy).catch(() => ({})),
    fetchWithFallback<any>(oiUrl, oiProxy).catch(() => ({})),
    fetchWithFallback<any[]>(ratioUrl, ratioProxy).catch(() => []),
  ]);

  const fundingRate = parseFloat(prem.lastFundingRate || '0.0001');
  const nextFundingTime = Number(prem.nextFundingTime || 0);
  const openInterest = parseFloat(oi.openInterest || '0');
  
  let longShortRatio = 1.0;
  let longAccountRatio = 0.5;
  let shortAccountRatio = 0.5;

  if (Array.isArray(ratioList) && ratioList.length > 0) {
    longShortRatio = parseFloat(ratioList[0].longShortRatio || '1.0');
    longAccountRatio = parseFloat(ratioList[0].longAccount || '0.5');
    shortAccountRatio = parseFloat(ratioList[0].shortAccount || '0.5');
  }

  return {
    fundingRate,
    nextFundingTime,
    openInterest,
    longShortRatio,
    longAccountRatio,
    shortAccountRatio,
  };
}

/**
 * Real-time Binance WebSocket Stream for live price and ticker updates
 */
export function connectBinanceWebSocket(
  symbol: string,
  callbacks: {
    onTicker: (data: { price: number; change24h: number; high24h: number; low24h: number; volume24h: number }) => void;
    onError?: (err: any) => void;
  }
): () => void {
  const wsUrl = `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@ticker`;
  let ws: WebSocket | null = null;
  let isClosed = false;
  let retryTimer: any = null;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data);
          if (d.c) { // current close price
            callbacks.onTicker({
              price: parseFloat(d.c),
              change24h: parseFloat(d.P),
              high24h: parseFloat(d.h),
              low24h: parseFloat(d.l),
              volume24h: parseFloat(d.q),
            });
          }
        } catch {
          // parse error
        }
      };

      ws.onerror = (err) => {
        callbacks.onError?.(err);
      };

      ws.onclose = () => {
        if (!isClosed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (!isClosed) {
        retryTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
