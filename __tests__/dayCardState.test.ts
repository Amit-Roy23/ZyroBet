import { getDayCardState } from '../src/features/rewards/utils/dayCardState';

describe('getDayCardState Util', () => {
  test('Day 1 uncollected cycle: Day 1 is today, Days 2-7 are locked', () => {
    expect(getDayCardState(1, 0, true, 1)).toBe('today');
    expect(getDayCardState(2, 0, true, 1)).toBe('locked');
    expect(getDayCardState(7, 0, true, 1)).toBe('locked');
  });

  test('Day 1 already claimed: Day 1 is claimed, Days 2-7 are locked', () => {
    expect(getDayCardState(1, 1, false, 1)).toBe('claimed');
    expect(getDayCardState(2, 1, false, 1)).toBe('locked');
    expect(getDayCardState(7, 1, false, 1)).toBe('locked');
  });

  test('Day 4 ready to claim: Days 1-3 are claimed, Day 4 is today, Days 5-7 are locked', () => {
    expect(getDayCardState(1, 3, true, 4)).toBe('claimed');
    expect(getDayCardState(2, 3, true, 4)).toBe('claimed');
    expect(getDayCardState(3, 3, true, 4)).toBe('claimed');
    expect(getDayCardState(4, 3, true, 4)).toBe('today');
    expect(getDayCardState(5, 3, true, 4)).toBe('locked');
    expect(getDayCardState(6, 3, true, 4)).toBe('locked');
    expect(getDayCardState(7, 3, true, 4)).toBe('locked');
  });

  test('Day 7 completed and claimed today: All 7 days are claimed', () => {
    for (let day = 1; day <= 7; day++) {
      expect(getDayCardState(day, 7, false, 7)).toBe('claimed');
    }
  });

  test('Day 7 ready to claim: Days 1-6 are claimed, Day 7 is today', () => {
    for (let day = 1; day <= 6; day++) {
      expect(getDayCardState(day, 6, true, 7)).toBe('claimed');
    }
    expect(getDayCardState(7, 6, true, 7)).toBe('today');
  });
});
