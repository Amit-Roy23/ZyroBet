jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => {
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
    return bytes;
  },
}));

import { DEMO_STARTING_BALANCE, demoBalanceNow, demoCall } from '../src/features/casino/demo';

describe('casino demo backend', () => {
  test('slots spin debits the bet and credits the payout', async () => {
    const before = demoBalanceNow();
    const res = await demoCall({ game: 'slots', action: 'spin', bet: 30 });
    expect(res.round?.status).toBe('settled');
    expect(res.balance).toBe(before - 30 + (res.round?.payout ?? 0));
  });

  test('rejects bets outside the limits', async () => {
    await expect(demoCall({ game: 'slots', action: 'spin', bet: 1 })).rejects.toMatchObject({
      code: 'INVALID_BET',
    });
    await expect(
      demoCall({ game: 'slots', action: 'spin', bet: DEMO_STARTING_BALANCE * 10 }),
    ).rejects.toMatchObject({ code: 'INVALID_BET' });
  });

  test('mines: reveal until settled, then nothing is active', async () => {
    const start = await demoCall({ game: 'mines', action: 'start', bet: 20, mines: 24 });
    const roundId = start.round!.id;
    await expect(
      demoCall({ game: 'mines', action: 'start', bet: 20, mines: 3 }),
    ).rejects.toMatchObject({
      code: 'ROUND_ACTIVE',
    });

    let res = start;
    for (let tile = 0; tile < 25 && res.round?.status === 'active'; tile++) {
      res = await demoCall({ game: 'mines', action: 'reveal', roundId, tile });
    }
    expect(res.round?.status).toBe('settled');
    const state = res.round!.state as { positions: number[]; revealed: number[] };
    expect(state.positions).toHaveLength(24);
    expect((await demoCall({ game: 'mines', action: 'active' })).round).toBeNull();
  });

  test('crash: cashing out immediately returns about the bet', async () => {
    const start = await demoCall({ game: 'crash', action: 'start', bet: 100, autoCashout: null });
    const res = await demoCall({ game: 'crash', action: 'cashout', roundId: start.round!.id });
    expect(res.round?.status).toBe('settled');
    // Either an instant crash (0) or a cash-out at ~1.00x
    expect([0, 100]).toContain(res.round?.payout);
  });
});
