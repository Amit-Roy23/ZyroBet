import { renderHook, act } from '@testing-library/react-native';
import { useCountdown } from '../src/features/rewards/hooks/useCountdown';

describe('useCountdown Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('formats remaining hours, minutes, and seconds accurately', async () => {
    const fixedNow = new Date('2026-10-06T12:00:00.000Z').getTime();
    jest.setSystemTime(fixedNow);

    // Target is 5 hours, 12 minutes, and 33 seconds in the future
    const targetIso = new Date(fixedNow + (5 * 3600 + 12 * 60 + 33) * 1000).toISOString();

    const { result } = await renderHook(() => useCountdown(targetIso, 0));

    expect(result.current.formatted).toBe('05:12:33');
    expect(result.current.hours).toBe(5);
    expect(result.current.minutes).toBe(12);
    expect(result.current.seconds).toBe(33);
    expect(result.current.isDone).toBe(false);
  });

  test('adjusts time calculation with serverOffsetMs', async () => {
    const fixedNow = new Date('2026-10-06T12:00:00.000Z').getTime();
    jest.setSystemTime(fixedNow);

    // Target is 3 hours from now on device clock, but server is 1 hour ahead (+1h offset)
    const targetIso = new Date(fixedNow + 3 * 3600 * 1000).toISOString();
    const serverOffsetMs = 1 * 3600 * 1000; // Server is +1h ahead

    const { result } = await renderHook(() => useCountdown(targetIso, serverOffsetMs));

    // Target - (Device + Offset) = 3h - 1h = 2 hours remaining
    expect(result.current.hours).toBe(2);
    expect(result.current.formatted).toBe('02:00:00');
  });

  test('marks isDone when target time has passed', async () => {
    const fixedNow = new Date('2026-10-06T12:00:00.000Z').getTime();
    jest.setSystemTime(fixedNow);

    const pastTargetIso = new Date(fixedNow - 5000).toISOString();
    const { result } = await renderHook(() => useCountdown(pastTargetIso, 0));

    expect(result.current.isDone).toBe(true);
    expect(result.current.formatted).toBe('00:00:00');
  });

  test('recalculates remaining time when props update', async () => {
    const fixedNow = new Date('2026-10-06T12:00:00.000Z').getTime();
    jest.setSystemTime(fixedNow);

    const targetIso = new Date(fixedNow + 10 * 1000).toISOString();
    const { result, rerender } = await renderHook(
      (props: { target: string; offset: number }) => useCountdown(props.target, props.offset),
      { initialProps: { target: targetIso, offset: 0 } },
    );

    expect(result.current.formatted).toBe('00:00:10');

    await act(async () => {
      await rerender({ target: targetIso, offset: 3000 });
    });

    expect(result.current.formatted).toBe('00:00:07');
  });
});
