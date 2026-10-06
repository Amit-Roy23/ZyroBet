import { GameModule } from './types';
import { Game2048 } from './game-2048/Game2048';
import { MemoryMatch } from './memory-match/MemoryMatch';
import { TapReaction } from './tap-reaction/TapReaction';
import { WordSprint } from './word-sprint/WordSprint';
import { QuizRush } from './quiz-rush/QuizRush';
import { CyberRunner } from './cyber-runner/CyberRunner';
import { ColorFlow } from './color-flow/ColorFlow';
import { EchoBeat } from './sound-match/EchoBeat';
import { TargetSniper } from './target-sniper/TargetSniper';
import { GAME_CATALOG, GameItem as CatalogGameItem } from '@/constants/gameCatalog';

export const GAME_REGISTRY: Record<string, GameModule> = {
  'game-2048': {
    id: 'game-2048',
    slug: 'neon-2048',
    title: 'Neon 2048',
    category: 'puzzle',
    description: 'Slide tiles and merge identical numbers to reach the legendary 2048 tile.',
    instructions: 'Swipe in any direction to move tiles. Matching tiles combine into their sum.',
    component: Game2048,
    icon: 'grid-3x3',
    bgGradient: ['#1E5A3C', '#0E2A1F'],
  },
  'neon-2048': {
    id: 'game-2048',
    slug: 'neon-2048',
    title: 'Neon 2048',
    category: 'puzzle',
    description: 'Slide tiles and merge identical numbers to reach the legendary 2048 tile.',
    instructions: 'Swipe in any direction to move tiles. Matching tiles combine into their sum.',
    component: Game2048,
    icon: 'grid-3x3',
    bgGradient: ['#1E5A3C', '#0E2A1F'],
  },
  'memory-match': {
    id: 'memory-match',
    slug: 'memory-matrix',
    title: 'Memory Matrix',
    category: 'puzzle',
    description: 'Test your visual memory by finding matching cards under the timer.',
    instructions: 'Flip two cards at a time to find identical pairs before time runs out.',
    difficulties: [
      { id: 'easy', label: 'Easy (3x4)' },
      { id: 'medium', label: 'Medium (4x4)' },
      { id: 'hard', label: 'Hard (4x5)' },
    ],
    defaultDifficulty: 'medium',
    component: MemoryMatch,
    icon: 'layers',
    bgGradient: ['#164E33', '#07140F'],
  },
  'memory-matrix': {
    id: 'memory-match',
    slug: 'memory-matrix',
    title: 'Memory Matrix',
    category: 'puzzle',
    description: 'Test your visual memory by finding matching cards under the timer.',
    instructions: 'Flip two cards at a time to find identical pairs before time runs out.',
    difficulties: [
      { id: 'easy', label: 'Easy (3x4)' },
      { id: 'medium', label: 'Medium (4x4)' },
      { id: 'hard', label: 'Hard (4x5)' },
    ],
    defaultDifficulty: 'medium',
    component: MemoryMatch,
    icon: 'layers',
    bgGradient: ['#164E33', '#07140F'],
  },
  'tap-reaction': {
    id: 'tap-reaction',
    slug: 'tap-reflex',
    title: 'Tap Reflex',
    category: 'arcade',
    description: 'Lightning-fast reaction game. Tap the pad as soon as the signal turns green!',
    instructions: 'Wait for the green signal, then tap as fast as possible across 5 rounds.',
    component: TapReaction,
    icon: 'zap',
    bgGradient: ['#2ECC71', '#123626'],
  },
  'tap-reflex': {
    id: 'tap-reaction',
    slug: 'tap-reflex',
    title: 'Tap Reflex',
    category: 'arcade',
    description: 'Lightning-fast reaction game. Tap the pad as soon as the signal turns green!',
    instructions: 'Wait for the green signal, then tap as fast as possible across 5 rounds.',
    component: TapReaction,
    icon: 'zap',
    bgGradient: ['#2ECC71', '#123626'],
  },
  'word-sprint': {
    id: 'word-sprint',
    slug: 'word-sprint',
    title: 'Word Sprint',
    category: 'puzzle',
    description: 'Unscramble letters and build words in a high-speed vocabulary challenge.',
    instructions: 'Form valid words from the provided letters before time expires.',
    component: WordSprint,
    icon: 'type',
    bgGradient: ['#1B4D3E', '#092117'],
  },
  'quiz-rush': {
    id: 'quiz-rush',
    slug: 'quiz-rush',
    title: 'Quiz Rush',
    category: 'quiz',
    description: 'Answer fast-paced general knowledge, pop culture, and science questions.',
    instructions: 'Pick the correct answer out of four options within 8 seconds per question.',
    component: QuizRush,
    icon: 'help-circle',
    bgGradient: ['#205D41', '#0C271C'],
  },
  'cyber-runner': {
    id: 'cyber-runner',
    slug: 'cyber-runner',
    title: 'Cyber Runner',
    category: 'arcade',
    description: 'Endless single-lane obstacle dodge runner in a retro synthwave style.',
    instructions: 'Shift left, right, or tap Jump to avoid barriers and collect virtual coins.',
    component: CyberRunner,
    icon: 'move',
    bgGradient: ['#287A50', '#0E2A1F'],
  },
  'color-flow': {
    id: 'color-flow',
    slug: 'color-flow',
    title: 'Color Flow',
    category: 'puzzle',
    description: 'Connect matching color nodes without crossing any paths.',
    instructions: 'Draw lines between matching color endpoints to fill the entire board.',
    component: ColorFlow,
    icon: 'share-2',
    bgGradient: ['#123626', '#07140F'],
  },
  'sound-match': {
    id: 'sound-match',
    slug: 'sound-match',
    title: 'Echo Beat',
    category: 'arcade',
    description: 'Listen to the audio sequence and repeat the pattern with perfect rhythm.',
    instructions: 'Memorize the musical sequence and tap the corresponding pads in order.',
    component: EchoBeat,
    icon: 'music',
    bgGradient: ['#164E33', '#0E2A1F'],
  },
  'target-sniper': {
    id: 'target-sniper',
    slug: 'target-sniper',
    title: 'Precision Tap',
    category: 'arcade',
    description: 'Tap moving bullseye rings right when they align with the center crosshair.',
    instructions: 'Timing is everything. Hit the gold inner circle for maximum points.',
    component: TargetSniper,
    icon: 'crosshair',
    bgGradient: ['#1E5A3C', '#0A2017'],
  },
};

export function getGameModule(idOrSlug: string): GameModule | undefined {
  return GAME_REGISTRY[idOrSlug.toLowerCase().trim()];
}

export function getGameById(id: string): CatalogGameItem | undefined {
  return GAME_CATALOG.find((g) => g.id === id || g.slug === id);
}

export function getGamesByCategory(category: string): CatalogGameItem[] {
  if (category === 'all') return GAME_CATALOG;
  if (category === 'hot') return GAME_CATALOG.filter((g) => g.isHot);
  return GAME_CATALOG.filter((g) => g.category === category);
}
