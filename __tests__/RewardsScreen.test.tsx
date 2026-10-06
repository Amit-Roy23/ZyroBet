import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RewardsScreen } from '../src/features/rewards/screens/RewardsScreen';

// Mock reduced motion
jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

// Mock useWallet
jest.mock('../src/features/wallet/hooks/useWallet', () => ({
  useWallet: () => ({
    balance: 1500,
  }),
}));

// Mock useRewardStatus & useClaimReward
const mockUseRewardStatus = jest.fn();
const mockUseClaimReward = jest.fn();

jest.mock('../src/features/rewards/hooks/useRewardStatus', () => ({
  useRewardStatus: () => mockUseRewardStatus(),
}));

jest.mock('../src/features/rewards/hooks/useClaimReward', () => ({
  useClaimReward: () => mockUseClaimReward(),
}));

describe('RewardsScreen Component', () => {
  beforeEach(() => {
    mockUseClaimReward.mockReturnValue({
      claim: jest.fn(),
      isLoading: false,
      claimResult: null,
      clearClaimResult: jest.fn(),
    });
  });

  test('renders claimable state with streak and reward button', async () => {
    mockUseRewardStatus.mockReturnValue({
      status: {
        streak: 3,
        longestStreak: 5,
        totalClaims: 12,
        cycleDay: 4,
        claimedDaysInCycle: 3,
        canClaim: true,
        lastClaimDate: '2026-10-05',
        streakWillReset: false,
        nextClaimAt: '2026-10-07T00:00:00.000Z',
        serverNow: '2026-10-06T12:00:00.000Z',
        config: [
          { day: 1, coins: 50 },
          { day: 2, coins: 75 },
          { day: 3, coins: 100 },
          { day: 4, coins: 150 },
          { day: 5, coins: 200 },
          { day: 6, coins: 300 },
          { day: 7, coins: 500 },
        ],
      },
      canClaim: true,
      streak: 3,
      longestStreak: 5,
      totalClaims: 12,
      cycleDay: 4,
      claimedDaysInCycle: 3,
      streakWillReset: false,
      nextClaimAt: '2026-10-07T00:00:00.000Z',
      serverOffsetMs: 0,
      config: [
        { day: 1, coins: 50 },
        { day: 2, coins: 75 },
        { day: 3, coins: 100 },
        { day: 4, coins: 150 },
        { day: 5, coins: 200 },
        { day: 6, coins: 300 },
        { day: 7, coins: 500 },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    await render(<RewardsScreen />);

    expect(screen.getByText('3 Days')).toBeTruthy();
    expect(screen.getByText('Claim 150 Free Coins')).toBeTruthy();
    expect(screen.getByText('7-Day Reward Cycle')).toBeTruthy();
    expect(screen.getByText('DAY 7 • MEGA BONUS')).toBeTruthy();
  });

  test('renders claimed countdown state when canClaim is false', async () => {
    mockUseRewardStatus.mockReturnValue({
      status: {
        streak: 4,
        longestStreak: 5,
        totalClaims: 13,
        cycleDay: 4,
        claimedDaysInCycle: 4,
        canClaim: false,
        lastClaimDate: '2026-10-06',
        streakWillReset: false,
        nextClaimAt: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
        serverNow: new Date().toISOString(),
        config: [
          { day: 1, coins: 50 },
          { day: 2, coins: 75 },
          { day: 3, coins: 100 },
          { day: 4, coins: 150 },
          { day: 5, coins: 200 },
          { day: 6, coins: 300 },
          { day: 7, coins: 500 },
        ],
      },
      canClaim: false,
      streak: 4,
      longestStreak: 5,
      totalClaims: 13,
      cycleDay: 4,
      claimedDaysInCycle: 4,
      streakWillReset: false,
      nextClaimAt: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
      serverOffsetMs: 0,
      config: [
        { day: 1, coins: 50 },
        { day: 2, coins: 75 },
        { day: 3, coins: 100 },
        { day: 4, coins: 150 },
        { day: 5, coins: 200 },
        { day: 6, coins: 300 },
        { day: 7, coins: 500 },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
      error: null,
    });

    await render(<RewardsScreen />);

    expect(screen.getByText('4 Days')).toBeTruthy();
    expect(screen.getByText('REWARD CLAIMED FOR TODAY')).toBeTruthy();
  });
});
