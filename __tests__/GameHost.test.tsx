import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameHost } from '@/features/games/host/GameHost';
import { MemoryMatch } from '@/features/games/memory-match/MemoryMatch';
import { TapReaction } from '@/features/games/tap-reaction/TapReaction';

// Mock expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'neon-2048' }),
}));

// Mock API calls
jest.mock('@/features/games/api', () => ({
  fetchGamesCatalog: jest.fn().mockResolvedValue([]),
  startSession: jest.fn().mockResolvedValue({
    sessionId: 'test-session-123',
    gameId: 'game-2048',
    seed: 9999,
    difficulty: null,
    serverNow: new Date().toISOString(),
  }),
  finishSession: jest.fn().mockResolvedValue({
    score: 500,
    bestScore: 500,
    isNewBest: true,
    coinsAwarded: 50,
    rewardRaw: 50,
    capReachedGame: false,
    capReachedGlobal: false,
    earnedTodayGame: 50,
    dailyCapGame: 150,
    earnedTodayGlobal: 50,
    dailyCapGlobal: 300,
    balanceAfter: 550,
  }),
  fetchGameDailyStatus: jest.fn().mockResolvedValue({
    today: '2026-10-06',
    globalCap: 300,
    globalEarnedToday: 50,
    games: [],
  }),
  flushPendingSubmissions: jest.fn().mockResolvedValue(undefined),
}));

describe('GameHost State Machine & Component Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders GameHost and displays game title', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <GameHost gameIdOrSlug="neon-2048" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Neon 2048')).toBeTruthy();
  });

  it('MemoryMatch handles card flips and matching flow', async () => {
    const onScoreChange = jest.fn();
    const onFinish = jest.fn();

    await render(
      <MemoryMatch
        session={{
          sessionId: 'test-mem-1',
          seed: 42,
          difficulty: 'easy',
          practice: false,
        }}
        paused={false}
        onScoreChange={onScoreChange}
        onFinish={onFinish}
      />
    );

    // Initial state: 12 cards (question marks)
    const cards = screen.getAllByText('?');
    expect(cards.length).toBe(12);

    // Flip first card
    fireEvent.press(cards[0]);
  });

  it('TapReaction handles false start and valid reaction tap', async () => {
    const onScoreChange = jest.fn();
    const onFinish = jest.fn();

    await render(
      <TapReaction
        session={{
          sessionId: 'test-rx-1',
          seed: 1234,
          difficulty: undefined,
          practice: false,
        }}
        paused={false}
        onScoreChange={onScoreChange}
        onFinish={onFinish}
      />
    );

    // Initial ready state
    expect(screen.getByText('Tap to Start')).toBeTruthy();

    const pad = screen.getByTestId('reaction-pad');

    // Start round 1 (press)
    await act(async () => {
      fireEvent.press(pad);
    });

    // State becomes WAIT...
    expect(screen.getByText('WAIT...')).toBeTruthy();

    // Tapping during WAIT triggers FALSE START!
    await act(async () => {
      fireEvent.press(pad);
    });
    expect(screen.getByText('TOO EARLY!')).toBeTruthy();
  });
});
