export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gamesPlayed: number;
  highScoreSum: number;
  isGuest: boolean;
  email?: string;
  createdAt: string;
}

export interface UserStats {
  totalWins: number;
  favoriteGame: string;
  bestStreak: number;
  totalCoinsEarned: number;
}
