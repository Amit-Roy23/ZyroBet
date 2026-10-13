import {
  PLINKO_PAYOUTS,
  PLINKO_RISK_OPTIONS,
  PLINKO_ROW_OPTIONS,
  SLOT_PAYTABLE,
  SLOT_SYMBOL_WEIGHTS,
  bytesToFloats,
  crashMultiplierAt,
  crashMsForMultiplier,
  crashPointFromFloat,
  dropPlinko,
  evaluateCrash,
  evaluateSlotLine,
  minesMultiplier,
  payoutFor,
  placeMines,
  spinSlots,
} from '../shared/engines/casino';
import { mulberry32 } from '../shared/engines/prng';

function binomial(n: number, k: number): number {
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

describe('casino engine', () => {
  test('bytesToFloats maps 4 bytes to one float in [0, 1)', () => {
    const floats = bytesToFloats(new Uint8Array([0, 0, 0, 0, 255, 255, 255, 255, 128, 0, 0, 0]));
    expect(floats).toHaveLength(3);
    expect(floats[0]).toBe(0);
    expect(floats[1]).toBeLessThan(1);
    expect(floats[2]).toBe(0.5);
  });

  test('payouts never round up', () => {
    expect(payoutFor(10, 1.99)).toBe(19);
    expect(payoutFor(33, 0.2)).toBe(6);
  });

  test('slots return between 95% and 97% of bets over time', () => {
    const total = SLOT_SYMBOL_WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let rtp = 0;
    for (const a of SLOT_SYMBOL_WEIGHTS)
      for (const b of SLOT_SYMBOL_WEIGHTS)
        for (const c of SLOT_SYMBOL_WEIGHTS) {
          const win = evaluateSlotLine([a.symbol, b.symbol, c.symbol]);
          if (win) rtp += ((a.weight * b.weight * c.weight) / total ** 3) * win.lineMultiplier;
        }
    expect(rtp).toBeGreaterThan(0.95);
    expect(rtp).toBeLessThan(0.97);
  });

  test('slot lines: three of a kind beats mixed combos, blanks never pay', () => {
    expect(evaluateSlotLine(['Cherry', 'Cherry', 'Cherry'])?.lineMultiplier).toBe(
      SLOT_PAYTABLE.Cherry,
    );
    expect(evaluateSlotLine(['Cherry', 'Seven', 'Seven'])?.type).toBe('CherryOrSeven');
    expect(evaluateSlotLine(['1xBAR', '3xBAR', '2xBAR'])?.type).toBe('AnyBar');
    expect(evaluateSlotLine(['Blank', 'Blank', 'Blank'])).toBeNull();
    expect(evaluateSlotLine(['Cherry', 'Blank', 'Cherry'])).toBeNull();
  });

  test('spinSlots builds a 3x3 grid and sums winning lines', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const result = spinSlots(Array.from({ length: 9 }, () => rng.next()));
      expect(result.grid).toHaveLength(3);
      result.grid.forEach((col) => expect(col).toHaveLength(3));
      const expected =
        Math.floor((result.lines.reduce((s, l) => s + l.lineMultiplier, 0) / 3) * 100 + 1e-9) / 100;
      expect(result.multiplier).toBe(expected);
    }
  });

  test('every plinko table returns about 99% and has rows + 1 bins', () => {
    for (const rows of PLINKO_ROW_OPTIONS) {
      for (const risk of PLINKO_RISK_OPTIONS) {
        const table = PLINKO_PAYOUTS[rows][risk];
        expect(table).toHaveLength(rows + 1);
        const rtp = table.reduce((s, m, k) => s + (m * binomial(rows, k)) / 2 ** rows, 0);
        expect(rtp).toBeGreaterThan(0.985);
        expect(rtp).toBeLessThan(0.995);
      }
    }
  });

  test('plinko bin equals the number of right bounces', () => {
    const result = dropPlinko(8, 'high', [0.9, 0.1, 0.6, 0.6, 0.2, 0.7, 0.4, 0.99]);
    expect(result.path).toEqual([1, 0, 1, 1, 0, 1, 0, 1]);
    expect(result.bin).toBe(5);
    expect(result.multiplier).toBe(PLINKO_PAYOUTS[8].high[5]);
  });

  test('mines are distinct tiles on the board', () => {
    const rng = mulberry32(7);
    for (const count of [1, 3, 10, 24]) {
      const mines = placeMines(
        count,
        Array.from({ length: count }, () => rng.next()),
      );
      expect(new Set(mines).size).toBe(count);
      mines.forEach((m) => {
        expect(m).toBeGreaterThanOrEqual(0);
        expect(m).toBeLessThan(25);
      });
    }
  });

  test('mines multiplier is fair odds minus 1%', () => {
    expect(minesMultiplier(3, 0)).toBe(1);
    // 1 mine, 1 safe reveal: 25/24 * 0.99 = 1.03125 -> 1.03
    expect(minesMultiplier(1, 1)).toBe(1.03);
    // 24 mines, 1 safe reveal: 25 * 0.99 = 24.75
    expect(minesMultiplier(24, 1)).toBe(24.75);
    expect(minesMultiplier(5, 3)).toBeGreaterThan(minesMultiplier(5, 2));
  });

  test('crash point: 1% instant crashes, P(>= x) = 0.99 / x', () => {
    expect(crashPointFromFloat(0)).toBe(1);
    expect(crashPointFromFloat(0.005)).toBe(1);
    expect(crashPointFromFloat(0.505)).toBe(2);
    expect(crashPointFromFloat(0.9999999)).toBe(1000);
  });

  test('crash multiplier curve and its inverse agree', () => {
    expect(crashMultiplierAt(0)).toBe(1);
    const ms = crashMsForMultiplier(2);
    expect(crashMultiplierAt(ms)).toBeGreaterThanOrEqual(2);
    expect(crashMultiplierAt(ms - 50)).toBeLessThan(2);
  });

  test('evaluateCrash honours auto cash-out only below the crash point', () => {
    const at3x = crashMsForMultiplier(3);
    expect(evaluateCrash(5, at3x, 2)).toEqual({ state: 'auto_cashed', multiplier: 2 });
    expect(evaluateCrash(1.5, at3x, 2)).toEqual({ state: 'crashed', crashPoint: 1.5 });
    expect(evaluateCrash(5, crashMsForMultiplier(1.2), 2).state).toBe('running');
    expect(evaluateCrash(2, at3x, 2)).toEqual({ state: 'crashed', crashPoint: 2 });
  });
});
