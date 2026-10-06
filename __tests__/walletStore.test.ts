import { useWalletStore } from '../src/features/wallet/store';

describe('WalletStore (Zustand + MMKV Persist)', () => {
  beforeEach(() => {
    useWalletStore.getState().reset();
  });

  test('initializes with starting guest coin balance', () => {
    const state = useWalletStore.getState();
    expect(state.balance).toBeGreaterThan(0);
    expect(typeof state.balance).toBe('number');
  });

  test('setBalance updates balance and timestamps lastSyncedAt', () => {
    const store = useWalletStore.getState();
    store.setBalance(2500);

    const updated = useWalletStore.getState();
    expect(updated.balance).toBe(2500);
    expect(updated.lastSyncedAt).not.toBeNull();
  });

  test('setBalance clamps negative balances to 0', () => {
    const store = useWalletStore.getState();
    store.setBalance(-500);

    const updated = useWalletStore.getState();
    expect(updated.balance).toBe(0);
  });

  test('creditLocal increments balance', () => {
    const store = useWalletStore.getState();
    store.setBalance(1000);
    store.creditLocal(250);

    const updated = useWalletStore.getState();
    expect(updated.balance).toBe(1250);
  });

  test('debitLocal subtracts balance when sufficient funds exist', () => {
    const store = useWalletStore.getState();
    store.setBalance(500);
    const success = store.debitLocal(200);

    expect(success).toBe(true);
    expect(useWalletStore.getState().balance).toBe(300);
  });

  test('debitLocal rejects when insufficient funds and preserves balance', () => {
    const store = useWalletStore.getState();
    store.setBalance(100);
    const success = store.debitLocal(500);

    expect(success).toBe(false);
    expect(useWalletStore.getState().balance).toBe(100);
  });

  test('displayBalance returns compact string representation', () => {
    const store = useWalletStore.getState();
    store.setBalance(12500);
    expect(store.displayBalance()).toBe('12.5K');
  });
});
