import { GAME_CATALOG, PROMO_BANNERS, LOBBY_CATEGORIES } from '../src/constants/gameCatalog';
import { getGameById, getGamesByCategory } from '../src/features/games/registry';

describe('gameCatalog and registry', () => {
  test('GAME_CATALOG contains valid games', () => {
    expect(GAME_CATALOG.length).toBeGreaterThan(0);
    GAME_CATALOG.forEach((game) => {
      expect(game.id).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.rewardCoins).toBeGreaterThan(0);
    });
  });

  test('getGameById retrieves game by id', () => {
    const neon = getGameById('neon-2048');
    expect(neon).toBeDefined();
    expect(neon?.title).toBe('Neon 2048');
  });

  test('getGamesByCategory filters correctly', () => {
    const puzzleGames = getGamesByCategory('puzzle');
    expect(puzzleGames.length).toBeGreaterThan(0);
    puzzleGames.forEach((g) => expect(g.category).toBe('puzzle'));

    const allGames = getGamesByCategory('all');
    expect(allGames.length).toBe(GAME_CATALOG.length);
  });
});
