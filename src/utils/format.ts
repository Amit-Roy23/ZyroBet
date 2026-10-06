/**
 * Currency, number and string formatting utilities
 */

export function formatCoins(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.floor(amount));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 10_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat('en-US').format(value);
  }
  return value.toString();
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}
