import { ImageSourcePropType } from 'react-native';

/**
 * Game Covers & Banner Assets
 * Strictly aligned to the game type & gameplay visuals.
 */
export const GAME_IMAGES: Record<string, ImageSourcePropType> = {
  'neon-2048': require('../../assets/games/neon-2048.jpg'),
  'game-2048': require('../../assets/games/neon-2048.jpg'),
  'memory-matrix': require('../../assets/games/memory-matrix.jpg'),
  'memory-match': require('../../assets/games/memory-matrix.jpg'),
  'tap-reflex': require('../../assets/games/tap-reflex.jpg'),
  'tap-reaction': require('../../assets/games/tap-reflex.jpg'),
  'word-sprint': require('../../assets/games/word-sprint.jpg'),
  'quiz-rush': require('../../assets/games/quiz-rush.jpg'),
  'cyber-runner': require('../../assets/games/cyber-runner.jpg'),
  'color-flow': require('../../assets/games/color-flow.jpg'),
  'sound-match': require('../../assets/games/sound-match.jpg'),
  'target-sniper': require('../../assets/games/target-sniper.jpg'),
};

export const BANNER_IMAGES: Record<string, ImageSourcePropType> = {
  'banner-1': require('../../assets/banners/banner-1.jpg'),
  'banner-2': require('../../assets/banners/banner-2.jpg'),
  'banner-3': require('../../assets/banners/banner-3.jpg'),
};

/**
 * Resolves the appropriate image source (bundled local asset or remote URL).
 */
export function getGameCoverSource(
  idOrSlug?: string,
  remoteUrl?: string
): ImageSourcePropType | { uri: string } {
  if (idOrSlug) {
    const key = idOrSlug.toLowerCase().trim();
    if (GAME_IMAGES[key]) {
      return GAME_IMAGES[key];
    }
  }

  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    return { uri: remoteUrl };
  }

  // Default fallback cover
  return GAME_IMAGES['neon-2048'];
}

/**
 * Resolves promo banner image source.
 */
export function getBannerSource(
  bannerId?: string,
  remoteUrl?: string
): ImageSourcePropType | { uri: string } {
  if (bannerId && BANNER_IMAGES[bannerId]) {
    return BANNER_IMAGES[bannerId];
  }

  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    return { uri: remoteUrl };
  }

  return BANNER_IMAGES['banner-1'];
}
