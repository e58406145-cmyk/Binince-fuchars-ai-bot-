import { CryptoPair, KlineData, OrderBookData, DerivativesData, Timeframe, ProductType } from '../../types/crypto';
import { fetchWithFallback } from './fetchHelper';

export const BITGET_TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
};

interface BitgetContract {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  minTradeNum?: string;
  pricePlace?: string;
  volumePlace?: string;
  symbolStatus?: string;
}

interface BitgetTicker {
  symbol: string;
  lastPr: string;
  change24h: string;
  usdtVolume: string;
  high24h: string;
  low24h: string;
}

export async function fetchBitgetSpotPairs(): Promise<CryptoPair[]> {
  const symbolsUrl = 'https://api.bitget.com/api/v2/spot/public/symbols';
  const symbolsProxy = '/api/bitget/api/v2/spot/public/symbols';

  const tickersUrl = 'https://api.bitget.com/api/v2/spot/market/tickers';
  const tickersProxy = '/api/bitget/api/v2/spot/market/tickers';

  const [symbolsRes, tickersRes] = await Promise.all([
    fetchWithFallback<{ code: string; data: BitgetContract[] }>(symbolsUrl, symbolsProxy).catch(() => ({ code: '0', data: [] as BitgetContract[] })),
    fetchWithFallback<{ code: string; data: BitgetTicker[] }>(tickersUrl, tickersProxy).catch(() => ({ code: '0', data: [] as BitgetTicker[] })),
  ]);

  const rawSymbols = symbolsRes.data || [];
  const rawTickers = tickersRes.data || [];

  const tickerMap = new Map<string, BitgetTicker>();
  rawTickers.forEach((t) => tickerMap.set(t.symbol, t));

  const validSymbols = rawSymbols.filter((c) => (!c.symbolStatus || c.symbolStatus === 'normal') && c.quoteCoin === 'USDT');

  return validSymbols.map((c) => {
    const ticker = tickerMap.get(c.symbol);
    const volume24h = ticker ? parseFloat(ticker.usdtVolume || (ticker as any).usdtVol || '0') || 0 : 0;
    const lastPrice = ticker ? parseFloat(ticker.lastPr) || 0 : 0;
    const priceChange = ticker ? parseFloat(ticker.change24h) * 100 || 0 : 0;

    return {
      symbol: c.symbol,
      baseAsset: c.baseCoin,
      quoteAsset: c.quoteCoin,
      displayName: `${c.baseCoin}/${c.quoteCoin}`,
      exchange: 'bitget' as const,
      productType: 'SPOT' as const,
      pricePrecision: c.pricePlace ? parseInt(c.pricePlace, 10) : 2,
      quantityPrecision: c.volumePlace ? parseInt(c.volumePlace, 10) : 3,
      status: c.symbolStatus || 'normal',
      volume24h,
      lastPrice,
      priceChangePercent24h: priceChange,
    };
  }).sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
}

export async function fetchBitgetSpotKlines(symbol: string, timeframe: Timeframe, limit = 100): Promise<KlineData[]> {
  const gran = BITGET_TIMEFRAME_MAP[timeframe] || '15m';
  const url = `https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=${gran}&limit=${limit}`;
  const proxy = `/api/bitget/api/v2/spot/market/candles?symbol=${symbol}&granularity=${gran}&limit=${limit}`;

  const res = await fetchWithFallback<{ code: string; data: any[][] }>(url, proxy);
  if (!res || !Array.isArray(res.data)) return [];

  const klines = res.data.map((k) => ({
    time: Number(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[6]),
  }));

  return klines.sort((a, b) => a.time - b.time);
}

export async function fetchBitgetSpotOrderBook(symbol: string, limit = 50): Promise<OrderBookData> {
  const url = `https://api.bitget.com/api/v2/spot/market/orderbook?symbol=${symbol}&type=step0&limit=${limit}`;
  const proxy = `/api/bitget/api/v2/spot/market/orderbook?symbol=${symbol}&type=step0&limit=${limit}`;

  const res = await fetchWithFallback<{ code: string; data: { bids: [string, string][]; asks: [string, string][]; ts: string } }>(url, proxy);
  const data = res?.data || { bids: [], asks: [], ts: '0' };

  return {
    timestamp: Number(data.ts) || Date.now(),
    bids: (data.bids || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
    asks: (data.asks || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
  };
}

export async function fetchBitgetPairs(productType: ProductType = 'USDT-FUTURES'): Promise<CryptoPair[]> {
  const pType: ProductType = (productType === 'USDC-FUTURES' || productType === 'COIN-FUTURES') ? productType : 'USDT-FUTURES';
  const contractsUrl = `https://api.bitget.com/api/v2/mix/market/contracts?productType=${pType}`;
  const contractsProxy = `/api/bitget/api/v2/mix/market/contracts?productType=${pType}`;

  const tickersUrl = `https://api.bitget.com/api/v2/mix/market/tickers?productType=${pType}`;
  const tickersProxy = `/api/bitget/api/v2/mix/market/tickers?productType=${pType}`;

  const [contractsRes, tickersRes] = await Promise.all([
    fetchWithFallback<{ code: string; data: BitgetContract[] }>(contractsUrl, contractsProxy).catch(() => ({ code: '0', data: [] as BitgetContract[] })),
    fetchWithFallback<{ code: string; data: BitgetTicker[] }>(tickersUrl, tickersProxy).catch(() => ({ code: '0', data: [] as BitgetTicker[] })),
  ]);

  const rawContracts = contractsRes.data || [];
  const rawTickers = tickersRes.data || [];

  const tickerMap = new Map<string, BitgetTicker>();
  rawTickers.forEach((t) => tickerMap.set(t.symbol, t));

  const validContracts = rawContracts.filter((c) => !c.symbolStatus || c.symbolStatus === 'normal');

  return validContracts.map((c) => {
    const ticker = tickerMap.get(c.symbol);
    const volume24h = ticker ? parseFloat(ticker.usdtVolume) || 0 : 0;
    const lastPrice = ticker ? parseFloat(ticker.lastPr) || 0 : 0;
    const priceChange = ticker ? parseFloat(ticker.change24h) * 100 || 0 : 0;

    return {
      symbol: c.symbol,
      baseAsset: c.baseCoin,
      quoteAsset: c.quoteCoin,
      displayName: `${c.baseCoin}/${c.quoteCoin}`,
      exchange: 'bitget' as const,
      productType: pType,
      pricePrecision: c.pricePlace ? parseInt(c.pricePlace, 10) : 2,
      quantityPrecision: c.volumePlace ? parseInt(c.volumePlace, 10) : 3,
      status: c.symbolStatus || 'normal',
      volume24h,
      lastPrice,
      priceChangePercent24h: priceChange,
    };
  }).sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
}

export async function fetchBitgetKlines(symbol: string, timeframe: Timeframe, productType: ProductType = 'USDT-FUTURES', limit = 100): Promise<KlineData[]> {
  const pType = (productType === 'USDC-FUTURES' || productType === 'COIN-FUTURES') ? productType : 'USDT-FUTURES';
  const gran = BITGET_TIMEFRAME_MAP[timeframe] || '15m';
  const url = `https://api.bitget.com/api/v2/mix/market/candles?symbol=${symbol}&granularity=${gran}&productType=${pType}&limit=${limit}`;
  const proxy = `/api/bitget/api/v2/mix/market/candles?symbol=${symbol}&granularity=${gran}&productType=${pType}&limit=${limit}`;

  const res = await fetchWithFallback<{ code: string; data: any[][] }>(url, proxy);
  if (!res || !Array.isArray(res.data)) return [];

  // Bitget candles format: [ts, open, high, low, close, volume, quoteVolume]
  // sorted descending by timestamp, so we reverse it to chronological ascending
  const klines = res.data.map((k) => ({
    time: Number(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[6]),
  }));

  // Sort ascending by time
  return klines.sort((a, b) => a.time - b.time);
}

export async function fetchBitgetOrderBook(symbol: string, productType: ProductType = 'USDT-FUTURES', limit = 50): Promise<OrderBookData> {
  const pType = (productType === 'USDC-FUTURES' || productType === 'COIN-FUTURES') ? productType : 'USDT-FUTURES';
  const url = `https://api.bitget.com/api/v2/mix/market/merge-depth?symbol=${symbol}&productType=${pType}&precision=scale0&limit=${limit}`;
  const proxy = `/api/bitget/api/v2/mix/market/merge-depth?symbol=${symbol}&productType=${pType}&precision=scale0&limit=${limit}`;

  const res = await fetchWithFallback<{ code: string; data: { bids: [string, string][]; asks: [string, string][]; ts: string } }>(url, proxy);
  const data = res?.data || { bids: [], asks: [], ts: '0' };

  return {
    timestamp: Number(data.ts) || Date.now(),
    bids: (data.bids || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
    asks: (data.asks || []).map(([p, a]) => ({ price: parseFloat(p), amount: parseFloat(a) })),
  };
}

export async function fetchBitgetDerivatives(symbol: string, productType: ProductType = 'USDT-FUTURES'): Promise<DerivativesData> {
  const pType = (productType === 'USDC-FUTURES' || productType === 'COIN-FUTURES') ? productType : 'USDT-FUTURES';
  const frUrl = `https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=${symbol}&productType=${pType}`;
  const frProxy = `/api/bitget/api/v2/mix/market/current-fund-rate?symbol=${symbol}&productType=${pType}`;

  const oiUrl = `https://api.bitget.com/api/v2/mix/market/open-interest?symbol=${symbol}&productType=${pType}`;
  const oiProxy = `/api/bitget/api/v2/mix/market/open-interest?symbol=${symbol}&productType=${pType}`;

  const [frRes, oiRes] = await Promise.all([
    fetchWithFallback<any>(frUrl, frProxy).catch(() => ({})),
    fetchWithFallback<any>(oiUrl, oiProxy).catch(() => ({})),
  ]);

  const frData = Array.isArray(frRes?.data) ? frRes.data[0] : (frRes?.data || {});
  const oiData = Array.isArray(oiRes?.data) ? oiRes.data[0] : (oiRes?.data || {});

  const fundingRate = parseFloat(frData.fundingRate || '0.0001');
  const openInterest = parseFloat(oiData.openInterest || oiData.amount || '0');

  return {
    fundingRate,
    openInterest,
    longShortRatio: 1.05,
    longAccountRatio: 0.51,
    shortAccountRatio: 0.49,
  };
}

export function connectBitgetWebSocket(
  symbol: string,
  productType: ProductType = 'USDT-FUTURES',
  callbacks: {
    onTicker: (data: { price: number; change24h: number; high24h: number; low24h: number; volume24h: number }) => void;
    onError?: (err: any) => void;
  }
): () => void {
  const pType = (productType === 'USDC-FUTURES' || productType === 'COIN-FUTURES') ? productType : 'USDT-FUTURES';
  const wsUrl = 'wss://ws.bitget.com/v2/ws/public';
  let ws: WebSocket | null = null;
  let isClosed = false;
  let pingInterval: any = null;
  let retryTimer: any = null;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Subscribe to ticker
        const subMsg = {
          op: 'subscribe',
          args: [
            {
              instType: pType,
              channel: 'ticker',
              instId: symbol,
            },
          ],
        };
        ws?.send(JSON.stringify(subMsg));

        // Bitget requires ping every 30s
        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const d = JSON.parse(event.data);
          if (d.data && Array.isArray(d.data) && d.data[0]) {
            const t = d.data[0];
            callbacks.onTicker({
              price: parseFloat(t.lastPr || t.last || '0'),
              change24h: parseFloat(t.change24h || '0') * 100,
              high24h: parseFloat(t.high24h || '0'),
              low24h: parseFloat(t.low24h || '0'),
              volume24h: parseFloat(t.usdtVolume || t.quoteVolume || '0'),
            });
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = (err) => {
        callbacks.onError?.(err);
      };

      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval);
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
    if (pingInterval) clearInterval(pingInterval);
    if (retryTimer) clearTimeout(retryTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
