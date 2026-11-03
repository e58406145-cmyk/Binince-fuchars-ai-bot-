/**
 * Safe number and crypto price formatting utilities
 * Prevents RangeError: maximumFractionDigits value is out of range
 */

export function formatCryptoPrice(price: number | undefined | null, precision?: number): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '--';
  }

  // Determine appropriate precision
  let prec = precision;
  if (prec === undefined || prec === null || prec < 0 || isNaN(prec)) {
    if (price >= 1000) prec = 2;
    else if (price >= 1) prec = 2;
    else if (price >= 0.01) prec = 4;
    else prec = 6;
  }

  // ECMAScript Intl.NumberFormat allows fraction digits between 0 and 20
  const safePrec = Math.min(Math.max(0, Math.floor(prec)), 8);
  const minDigits = Math.min(2, safePrec);
  const maxDigits = Math.max(minDigits, safePrec);

  try {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
  } catch {
    return price.toFixed(safePrec);
  }
}

export function formatPercent(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}
