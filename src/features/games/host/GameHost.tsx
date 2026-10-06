import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  BackHandler,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useKeepAwake } from '@/lib/keepAwake';

import { colors, spacing } from '@/theme';
import { getGameModule } from '../registry';
import { useStartSession } from '../hooks/useStartSession';
import { useFinishSession } from '../hooks/useFinishSession';
import { useBestScore } from '../hooks/useBestScore';
import { GameProps, GameFinishResult } from '../types';
import { GameHostTopBar } from '../components/GameHostTopBar';
import { DifficultyPickerModal } from '../components/DifficultyPickerModal';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { GamePauseModal } from '../components/GamePauseModal';
import { GameResultModal } from '../components/GameResultModal';
import { flushPendingSubmissions } from '../api';

type HostState =
  | 'loading'
  | 'difficultyPicker'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'finishing'
  | 'result';

interface GameHostProps {
  gameIdOrSlug: string;
}

export function GameHost({ gameIdOrSlug }: GameHostProps) {
  const router = useRouter();
  const gameModule = getGameModule(gameIdOrSlug);

  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(
    gameModule?.defaultDifficulty
  );
  const [hostState, setHostState] = useState<HostState>(() => {
    if (
      gameModule?.difficulties &&
      gameModule.difficulties.length > 0 &&
      !gameModule.defaultDifficulty
    ) {
      return 'difficultyPicker';
    }
    return 'loading';
  });
  const [session, setSession] = useState<GameProps['session'] | null>(null);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [finishResult, setFinishResult] = useState<
    (GameFinishResult & { isPendingQueue?: boolean }) | null
  >(null);

  const startSessionMutation = useStartSession();
  const finishSessionMutation = useFinishSession();
  const bestScore = useBestScore(gameModule?.id || gameIdOrSlug, selectedDifficulty);

  // Keep screen awake while in active game play
  useKeepAwake();

  // Try flushing any previously queued score submissions on mount
  useEffect(() => {
    flushPendingSubmissions();
  }, []);

  // Initialize Game Session
  const initSession = useCallback(
    async (difficulty?: string) => {
      if (!gameModule) return;
      setHostState('loading');
      setLiveScore(0);
      setFinishResult(null);

      const sess = await startSessionMutation.mutateAsync({
        gameId: gameModule.id,
        difficulty,
      });

      setSession(sess);

      // Tap reaction skips 3-2-1 countdown for immediate reaction state
      if (gameModule.id === 'tap-reaction') {
        setHostState('playing');
      } else {
        setHostState('countdown');
      }
    },
    [gameModule, startSessionMutation]
  );

  // Initial session startup if no difficulty picker needed
  useEffect(() => {
    let active = true;
    if (!gameModule) return;
    if (!gameModule.difficulties || gameModule.difficulties.length === 0 || selectedDifficulty) {
      startSessionMutation
        .mutateAsync({
          gameId: gameModule.id,
          difficulty: selectedDifficulty,
        })
        .then((sess) => {
          if (!active) return;
          setSession(sess);
          if (gameModule.id === 'tap-reaction') {
            setHostState('playing');
          } else {
            setHostState('countdown');
          }
        })
        .catch(() => {
          // Handled via practice fallback in hook
        });
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameModule]);

  // Pause on AppState Background or Web Tab Switch
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState.match(/inactive|background/) && hostState === 'playing') {
        setHostState('paused');
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && hostState === 'playing') {
        setHostState('paused');
      }
    };
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      sub.remove();
      if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [hostState]);

  // Handle Hardware / Gesture Back
  const handleBackPress = useCallback(() => {
    if (hostState === 'playing') {
      setHostState('paused');
      return true;
    }
    if (hostState === 'difficultyPicker' || hostState === 'loading' || hostState === 'result') {
      router.back();
      return true;
    }
    return false;
  }, [hostState, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  // Finish game callback from engine/game component
  const handleGameFinish = useCallback(
    async (payload: unknown, durationMs: number) => {
      if (!gameModule || !session) return;
      setHostState('finishing');

      const result = await finishSessionMutation.mutateAsync({
        sessionId: session.sessionId,
        gameId: gameModule.id,
        difficulty: session.difficulty,
        durationMs,
        payload,
        practice: session.practice,
        localScore: liveScore,
      });

      setFinishResult(result);
      setHostState('result');
    },
    [gameModule, session, finishSessionMutation, liveScore]
  );

  if (!gameModule) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Game not found: {gameIdOrSlug}</Text>
        <Text style={styles.backLink} onPress={() => router.back()}>
          Back to Lobby
        </Text>
      </View>
    );
  }

  const GameComponent = gameModule.component;

  return (
    <View style={styles.container}>
      {/* Top Bar HUD */}
      <GameHostTopBar
        title={gameModule.title}
        score={liveScore}
        bestScore={Math.max(bestScore, liveScore)}
        isPlaying={hostState === 'playing'}
        onBack={() => {
          if (hostState === 'playing') {
            Alert.alert(
              'Quit Game?',
              'Are you sure you want to quit? Current progress will not be saved.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Quit', style: 'destructive', onPress: () => router.back() },
              ]
            );
          } else {
            router.back();
          }
        }}
        onPause={() => setHostState('paused')}
      />

      {/* Main Content Area */}
      <View style={styles.gameContent}>
        {session && hostState !== 'loading' && hostState !== 'difficultyPicker' && (
          <GameComponent
            session={session}
            paused={hostState === 'paused'}
            onScoreChange={setLiveScore}
            onFinish={handleGameFinish}
          />
        )}

        {(hostState === 'loading' || hostState === 'finishing') && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {hostState === 'loading' ? 'Starting Game Session...' : 'Verifying & Saving Score...'}
            </Text>
          </View>
        )}
      </View>

      {/* Countdown Overlay */}
      {hostState === 'countdown' && (
        <CountdownOverlay onComplete={() => setHostState('playing')} />
      )}

      {/* Difficulty Picker */}
      <DifficultyPickerModal
        visible={hostState === 'difficultyPicker'}
        gameTitle={gameModule.title}
        difficulties={gameModule.difficulties || []}
        onSelect={(diff) => {
          setSelectedDifficulty(diff);
          initSession(diff);
        }}
        onCancel={() => router.back()}
      />

      {/* Pause Modal */}
      <GamePauseModal
        visible={hostState === 'paused'}
        onResume={() => setHostState('playing')}
        onRestart={() => initSession(selectedDifficulty)}
        onQuit={() => router.back()}
      />

      {/* Result Modal */}
      <GameResultModal
        visible={hostState === 'result'}
        result={finishResult}
        isPractice={session?.practice || false}
        gameTitle={gameModule.title}
        gameId={gameModule.id}
        onPlayAgain={() => initSession(selectedDifficulty)}
        onHome={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gameContent: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  backLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 26, 16, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
