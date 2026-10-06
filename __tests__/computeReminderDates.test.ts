import { computeReminderDate } from '../src/features/rewards/notifications/scheduler';

describe('computeReminderDate Notification Scheduler', () => {
  test('computes reminder at local 18:00 inside the next 24h reward window', () => {
    // Next reward window starts at 2026-10-07T00:00:00.000Z
    const nextClaimAtServer = '2026-10-07T00:00:00.000Z';
    const serverOffsetMs = 0;
    const reminderHHmm = '18:00';

    const reminderDate = computeReminderDate(nextClaimAtServer, serverOffsetMs, reminderHHmm);

    expect(reminderDate.getHours()).toBe(18);
    expect(reminderDate.getMinutes()).toBe(0);

    const windowStart = new Date(nextClaimAtServer).getTime();
    const windowEnd = windowStart + 24 * 3600 * 1000;

    expect(reminderDate.getTime()).toBeGreaterThanOrEqual(windowStart);
    expect(reminderDate.getTime()).toBeLessThan(windowEnd);
  });

  test('handles morning reminder times (e.g. 09:30)', () => {
    const nextClaimAtServer = '2026-10-07T00:00:00.000Z';
    const serverOffsetMs = 0;
    const reminderHHmm = '09:30';

    const reminderDate = computeReminderDate(nextClaimAtServer, serverOffsetMs, reminderHHmm);

    expect(reminderDate.getHours()).toBe(9);
    expect(reminderDate.getMinutes()).toBe(30);

    const windowStart = new Date(nextClaimAtServer).getTime();
    const windowEnd = windowStart + 24 * 3600 * 1000;

    expect(reminderDate.getTime()).toBeGreaterThanOrEqual(windowStart);
    expect(reminderDate.getTime()).toBeLessThan(windowEnd);
  });

  test('adjusts for serverOffsetMs', () => {
    const nextClaimAtServer = '2026-10-07T00:00:00.000Z';
    const serverOffsetMs = 2 * 3600 * 1000; // Server 2 hours ahead
    const reminderHHmm = '18:00';

    const reminderDate = computeReminderDate(nextClaimAtServer, serverOffsetMs, reminderHHmm);
    expect(reminderDate.getHours()).toBe(18);
  });
});
