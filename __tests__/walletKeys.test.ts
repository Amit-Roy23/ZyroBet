import { walletKeys } from '../src/features/wallet/keys';

describe('walletKeys Query Key Factory', () => {
  test('all root key', () => {
    expect(walletKeys.all).toEqual(['wallet']);
  });

  test('balance key with userId', () => {
    expect(walletKeys.balance('usr-123')).toEqual(['wallet', 'balance', 'usr-123']);
  });

  test('balance key fallback when anonymous', () => {
    expect(walletKeys.balance(undefined)).toEqual(['wallet', 'balance', 'anonymous']);
  });

  test('transactions key with filter and userId', () => {
    expect(walletKeys.transactions('usr-123', 'earned')).toEqual([
      'wallet',
      'transactions',
      'usr-123',
      'earned',
    ]);
    expect(walletKeys.transactions('usr-123', 'spent')).toEqual([
      'wallet',
      'transactions',
      'usr-123',
      'spent',
    ]);
    expect(walletKeys.transactions(undefined, 'all')).toEqual([
      'wallet',
      'transactions',
      'anonymous',
      'all',
    ]);
  });
});
