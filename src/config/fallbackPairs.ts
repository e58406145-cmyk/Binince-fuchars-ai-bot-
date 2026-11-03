import { CryptoPair } from '../types/crypto';

/**
 * Bundled offline fallback perpetual pairs list.
 * Used ONLY when exchange REST API fails or device is offline.
 */
export const FALLBACK_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT',
  'TRXUSDT', 'LINKUSDT', 'DOTUSDT', 'TONUSDT', 'MATICUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'NEARUSDT', 'UNIUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT', 'INJUSDT', 'FILUSDT',
  'ETCUSDT', 'XLMUSDT', 'HBARUSDT', 'AAVEUSDT', 'MKRUSDT', 'RUNEUSDT', 'SEIUSDT', 'TIAUSDT',
  'ICPUSDT', 'PEPEUSDT', 'SHIBUSDT', 'WIFUSDT', 'BONKUSDT', 'FETUSDT', 'RENDERUSDT', 'GRTUSDT',
  'IMXUSDT', 'ALGOUSDT', 'VETUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'EGLDUSDT', 'FTMUSDT',
  'THETAUSDT', 'ORDIUSDT', 'JUPUSDT'
] as const;

/**
 * Converts fallback symbols into standard CryptoPair structures
 */
export function getBundledFallbackPairs(exchange: 'binance' | 'bitget' = 'binance'): CryptoPair[] {
  return FALLBACK_SYMBOLS.map((symbol) => {
    const baseAsset = symbol.replace('USDT', '');
    const quoteAsset = 'USDT';

    // Reasonable default price precisions for common assets
    let pricePrecision = 2;
    if (['PEPEUSDT', 'SHIBUSDT', 'BONKUSDT'].includes(symbol)) {
      pricePrecision = 7;
    } else if (['DOGEUSDT', 'XLMUSDT', 'TRXUSDT', 'VETUSDT'].includes(symbol)) {
      pricePrecision = 4;
    } else if (['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'MKRUSDT', 'BCHUSDT'].includes(symbol)) {
      pricePrecision = 2;
    }

    return {
      symbol,
      baseAsset,
      quoteAsset,
      displayName: `${baseAsset}/${quoteAsset}`,
      exchange,
      productType: exchange === 'binance' ? 'USDT-M' : 'USDT-FUTURES',
      pricePrecision,
      quantityPrecision: 3,
      status: 'TRADING',
      volume24h: 50_000_000, // estimated offline baseline
      lastPrice: undefined,
      priceChangePercent24h: 0,
      isFavorite: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(symbol),
    };
  });
}
