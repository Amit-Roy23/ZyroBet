/**
 * ZyroBet Game Catalog & Lobby Mock Data
 * Strictly skill-based casual mini-games only.
 */

export interface GameItem {
  id: string;
  slug: string;
  title: string;
  category: 'puzzle' | 'arcade' | 'quiz' | 'events' | 'action';
  gameType?: string; // e.g. 'Tile Merger', 'Memory Matrix', 'Reflex Tap'
  description: string;
  instructions: string;
  thumbnailUrl: string;
  bgGradient: [string, string];
  isNew?: boolean;
  isHot?: boolean;
  playerCount: number;
  entryFee: number; // 0 for free play or virtual practice
  rewardCoins: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  icon: string;
  enabled: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  bgGradient: [string, string];
  actionRoute: string;
  buttonText: string;
}

export interface AnnouncementTickerItem {
  id: string;
  text: string;
  icon: string;
  highlight?: string;
}

export interface LobbyCategory {
  id: string;
  label: string;
  icon: string;
}

export const LOBBY_CATEGORIES: LobbyCategory[] = [
  { id: 'all', label: 'Home', icon: 'grid' },
  { id: 'hot', label: 'Hot', icon: 'flame' },
  { id: 'puzzle', label: 'Puzzle', icon: 'puzzle' },
  { id: 'arcade', label: 'Arcade', icon: 'gamepad-2' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle' },
  { id: 'events', label: 'Live Events', icon: 'trophy' },
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'banner-1',
    title: 'Weekend High Score Blast',
    subtitle: 'Merge tiles to reach the legendary 2048 and win +1,500 bonus coins!',
    badge: 'SPECIAL EVENT',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    bgGradient: ['#123626', '#0E2A1F'],
    actionRoute: '/game/neon-2048',
    buttonText: 'Play Now',
  },
  {
    id: 'banner-2',
    title: 'Daily Streak Mystery Vault',
    subtitle: 'Check in 7 days in a row to unlock the 3x Coin Multiplier Chest.',
    badge: 'DAILY REWARDS',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    bgGradient: ['#1A4B35', '#07140F'],
    actionRoute: '/(tabs)/rewards',
    buttonText: 'Claim Streak',
  },
  {
    id: 'banner-3',
    title: 'Brain Rush: Trivia Royale',
    subtitle: 'Test your knowledge across 10 rapid-fire questions against thousands!',
    badge: 'HOT MINI-GAME',
    imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80',
    bgGradient: ['#0E382B', '#07140F'],
    actionRoute: '/game/quiz-rush',
    buttonText: 'Challenge',
  },
];

export const ANNOUNCEMENTS: AnnouncementTickerItem[] = [
  {
    id: 'ann-1',
    text: 'Player AlexFox just reached 2048 tile in Neon 2048!',
    icon: 'trophy',
    highlight: 'AlexFox',
  },
  {
    id: 'ann-2',
    text: 'Daily Reward Reset: 250 Virtual Coins ready to claim.',
    icon: 'gift',
    highlight: '250 Virtual Coins',
  },
  {
    id: 'ann-3',
    text: 'New skill game "Cyber Runner" has landed in Arcade!',
    icon: 'sparkles',
    highlight: 'Cyber Runner',
  },
  {
    id: 'ann-4',
    text: 'Reminder: All coins are 100% virtual and for entertainment.',
    icon: 'shield-check',
    highlight: '100% virtual',
  },
];

export const GAME_CATALOG: GameItem[] = [
  {
    id: 'neon-2048',
    slug: 'neon-2048',
    title: 'Neon 2048',
    category: 'puzzle',
    gameType: 'Tile Merger',
    description: 'Slide tiles and merge numbers to reach the legendary 2048 tile.',
    instructions: 'Swipe in any direction to move tiles. Identical numbers merge into one.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#1E5A3C', '#0E2A1F'],
    isHot: true,
    playerCount: 14200,
    entryFee: 0,
    rewardCoins: 150,
    difficulty: 'Medium',
    icon: 'grid-3x3',
    enabled: true,
  },
  {
    id: 'memory-matrix',
    slug: 'memory-matrix',
    title: 'Memory Matrix',
    category: 'puzzle',
    gameType: 'Card Match',
    description: 'Test your visual memory by finding matching cards under the timer.',
    instructions: 'Flip two cards at a time to find identical pairs before time runs out.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#164E33', '#07140F'],
    isNew: true,
    isHot: true,
    playerCount: 8900,
    entryFee: 0,
    rewardCoins: 120,
    difficulty: 'Easy',
    icon: 'layers',
    enabled: true,
  },
  {
    id: 'tap-reflex',
    slug: 'tap-reflex',
    title: 'Tap Reflex',
    category: 'arcade',
    gameType: 'Reaction Speed',
    description: 'Lightning-fast reaction game. Tap the pad as soon as the signal turns green!',
    instructions: 'Tap glowing targets as fast as possible across 5 precision rounds.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#2ECC71', '#123626'],
    isHot: true,
    playerCount: 22100,
    entryFee: 0,
    rewardCoins: 200,
    difficulty: 'Hard',
    icon: 'zap',
    enabled: true,
  },
  {
    id: 'word-sprint',
    slug: 'word-sprint',
    title: 'Word Sprint',
    category: 'puzzle',
    gameType: 'Anagram Puzzle',
    description: 'Unscramble letters and build words in a high-speed vocabulary challenge.',
    instructions: 'Form valid words from the provided letters before time expires.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#1B4D3E', '#092117'],
    isNew: true,
    playerCount: 6300,
    entryFee: 0,
    rewardCoins: 180,
    difficulty: 'Medium',
    icon: 'type',
    enabled: true,
  },
  {
    id: 'quiz-rush',
    slug: 'quiz-rush',
    title: 'Quiz Rush',
    category: 'quiz',
    gameType: 'Trivia Quiz',
    description: 'Answer fast-paced general knowledge, pop culture, and science questions.',
    instructions: 'Pick the correct answer out of four options within 10 seconds per round.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#205D41', '#0C271C'],
    isHot: true,
    playerCount: 17800,
    entryFee: 0,
    rewardCoins: 220,
    difficulty: 'Medium',
    icon: 'help-circle',
    enabled: true,
  },
  {
    id: 'cyber-runner',
    slug: 'cyber-runner',
    title: 'Cyber Runner',
    category: 'arcade',
    gameType: 'Endless Runner',
    description: 'Endless single-lane obstacle dodge runner in a retro synthwave style.',
    instructions: 'Swipe left, right, or up to jump over energy barriers and collect coins.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#287A50', '#0E2A1F'],
    isNew: true,
    playerCount: 11400,
    entryFee: 0,
    rewardCoins: 250,
    difficulty: 'Hard',
    icon: 'move',
    enabled: true,
  },
  {
    id: 'color-flow',
    slug: 'color-flow',
    title: 'Color Flow',
    category: 'puzzle',
    gameType: 'Pipe Connect',
    description: 'Connect matching color nodes without crossing any paths.',
    instructions: 'Draw lines between matching color endpoints to fill the entire board.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#123626', '#07140F'],
    playerCount: 7500,
    entryFee: 0,
    rewardCoins: 140,
    difficulty: 'Easy',
    icon: 'share-2',
    enabled: true,
  },
  {
    id: 'sound-match',
    slug: 'sound-match',
    title: 'Echo Beat',
    category: 'arcade',
    gameType: 'Rhythm Beat',
    description: 'Listen to the audio sequence and repeat the pattern with perfect rhythm.',
    instructions: 'Memorize the musical sequence and tap the corresponding buttons in order.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#164E33', '#0E2A1F'],
    playerCount: 5200,
    entryFee: 0,
    rewardCoins: 160,
    difficulty: 'Medium',
    icon: 'music',
    enabled: true,
  },
  {
    id: 'target-sniper',
    slug: 'target-sniper',
    title: 'Precision Tap',
    category: 'arcade',
    gameType: 'Target Aim',
    description: 'Tap moving bullseye rings right when they align with the center crosshair.',
    instructions: 'Timing is everything. Hit the gold inner circle for maximum points.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    bgGradient: ['#1E5A3C', '#0A2017'],
    playerCount: 9100,
    entryFee: 0,
    rewardCoins: 190,
    difficulty: 'Hard',
    icon: 'crosshair',
    enabled: true,
  },
];

export const SIDE_SHORTCUTS = [
  { id: 'support', label: 'Support', icon: 'headphones', route: '/(tabs)/account' },
  { id: 'community', label: 'Community', icon: 'users', route: '/(tabs)/account' },
  { id: 'share', label: 'Share', icon: 'share-2', route: '/(tabs)/account' },
];
