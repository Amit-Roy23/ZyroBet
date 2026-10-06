/**
 * TanStack Query Key Factory for Daily Rewards
 */
export const rewardKeys = {
  all: ['rewards'] as const,
  status: (userId?: string) => [...rewardKeys.all, 'status', userId ?? 'anonymous'] as const,
};
