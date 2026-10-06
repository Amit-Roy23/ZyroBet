import { groupTransactionsByDay, getDayGroupTitle, formatTime, formatDate } from '../src/utils/date';
import { LedgerEntry } from '../src/features/wallet/types';

describe('Date Grouping & Formatting Utilities', () => {
  const fixedNow = new Date('2026-10-06T12:00:00.000Z');

  test('getDayGroupTitle returns "Today" for current day items', () => {
    const todayIso = '2026-10-06T08:30:00.000Z';
    expect(getDayGroupTitle(todayIso, fixedNow)).toBe('Today');
  });

  test('getDayGroupTitle returns "Yesterday" for prior day items', () => {
    const yesterdayIso = '2026-10-05T18:00:00.000Z';
    expect(getDayGroupTitle(yesterdayIso, fixedNow)).toBe('Yesterday');
  });

  test('getDayGroupTitle returns formatted date for older items', () => {
    const olderIso = '2026-10-01T10:00:00.000Z';
    const title = getDayGroupTitle(olderIso, fixedNow);
    expect(title).toContain('2026');
    expect(title).toContain('Oct');
  });

  test('formatTime formats time into AM/PM string', () => {
    const timeStr = '2026-10-06T14:30:00.000Z';
    const formatted = formatTime(timeStr);
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  test('formatDate formats date into Month Day, Year', () => {
    const dateStr = '2026-10-06T14:30:00.000Z';
    const formatted = formatDate(dateStr);
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('2026');
  });

  test('groupTransactionsByDay groups ledger entries into sections by calendar day', () => {
    const entries: LedgerEntry[] = [
      {
        id: 'tx-1',
        userId: 'user-1',
        delta: 100,
        balanceAfter: 600,
        reason: 'game_reward',
        refId: 'game-1',
        idempotencyKey: 'k-1',
        createdAt: '2026-10-06T10:00:00.000Z',
      },
      {
        id: 'tx-2',
        userId: 'user-1',
        delta: 200,
        balanceAfter: 800,
        reason: 'daily_reward',
        refId: null,
        idempotencyKey: 'k-2',
        createdAt: '2026-10-06T09:00:00.000Z',
      },
      {
        id: 'tx-3',
        userId: 'user-1',
        delta: -50,
        balanceAfter: 750,
        reason: 'spend',
        refId: 'game-2',
        idempotencyKey: 'k-3',
        createdAt: '2026-10-05T20:00:00.000Z',
      },
      {
        id: 'tx-4',
        userId: 'user-1',
        delta: 500,
        balanceAfter: 500,
        reason: 'signup_bonus',
        refId: null,
        idempotencyKey: 'k-4',
        createdAt: '2026-10-01T15:00:00.000Z',
      },
    ];

    const grouped = groupTransactionsByDay(entries, fixedNow);

    expect(grouped).toHaveLength(3);
    expect(grouped[0].title).toBe('Today');
    expect(grouped[0].data).toHaveLength(2);
    expect(grouped[0].data[0].id).toBe('tx-1');
    expect(grouped[0].data[1].id).toBe('tx-2');

    expect(grouped[1].title).toBe('Yesterday');
    expect(grouped[1].data).toHaveLength(1);
    expect(grouped[1].data[0].id).toBe('tx-3');

    expect(grouped[2].title).toContain('Oct');
    expect(grouped[2].data).toHaveLength(1);
    expect(grouped[2].data[0].id).toBe('tx-4');
  });
});
