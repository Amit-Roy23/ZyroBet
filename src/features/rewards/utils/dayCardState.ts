import { DayCardState } from '../types';

/**
 * Maps cycle progression to individual card visual state
 *
 * @param dayNumber Day index (1 to 7)
 * @param claimedDaysInCycle Number of days already claimed in current 7-day cycle (0 to 7)
 * @param canClaim Whether user is eligible to claim right now
 * @param cycleDay The target cycle day for the next claim (or today's claim)
 */
export function getDayCardState(
  dayNumber: number,
  claimedDaysInCycle: number,
  canClaim: boolean,
  cycleDay: number,
): DayCardState {
  // If this slot was already claimed in this cycle
  if (dayNumber <= claimedDaysInCycle) {
    return 'claimed';
  }

  // If this slot is available to be claimed right now
  if (dayNumber === cycleDay && canClaim) {
    return 'today';
  }

  // Future unreached slots or locked
  return 'locked';
}
