export type LeaderboardPeriod = 'daily' | 'weekly' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  gameId?: string;
  gameTitle?: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardFilter {
  period: LeaderboardPeriod;
  gameId?: string; // undefined for global score leaderboard
}
