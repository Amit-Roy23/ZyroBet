import { formatCoins, formatNumber, formatCompact, formatCurrency } from '../src/utils/format';

describe('format utilities', () => {
  test('formatCoins formats coin integers with commas', () => {
    expect(formatCoins(0)).toBe('0');
    expect(formatCoins(1000)).toBe('1,000');
    expect(formatCoins(125000)).toBe('125,000');
    expect(formatCoins(null)).toBe('0');
    expect(formatCoins(undefined)).toBe('0');
  });

  test('formatNumber formats numbers with commas', () => {
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(24500)).toBe('24,500');
  });

  test('formatCompact formats numbers compactly (1,250 / 12.5K / 1.2M)', () => {
    expect(formatCompact(500)).toBe('500');
    expect(formatCompact(1250)).toBe('1,250');
    expect(formatCompact(12500)).toBe('12.5K');
    expect(formatCompact(20000)).toBe('20K');
    expect(formatCompact(1200000)).toBe('1.2M');
  });

  test('formatCurrency formats USD prices', () => {
    expect(formatCurrency(0.99)).toBe('$0.99');
    expect(formatCurrency(4.99)).toBe('$4.99');
  });
});
