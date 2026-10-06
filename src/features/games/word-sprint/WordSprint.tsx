import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import { getWordSprintGame, WordSprintLetterPool } from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

const GAME_DURATION_SECONDS = 45;

export function WordSprint({ session, paused, onScoreChange, onFinish }: GameProps) {
  const { width } = useWindowDimensions();
  const [gamePool] = useState<WordSprintLetterPool>(() => getWordSprintGame(session.seed));

  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [usedLetterIndices, setUsedLetterIndices] = useState<number[]>([]);
  const [solvedWords, setSolvedWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const wordsLogRef = useRef<string[]>([]);
  const finishedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  // End Game handler
  const handleEndGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    soundManager.playSound('win');
    haptics.notification('success');

    onFinish(
      {
        words: wordsLogRef.current,
        timestamps: [],
      },
      (GAME_DURATION_SECONDS - timeLeft) * 1000 || GAME_DURATION_SECONDS * 1000
    );
  }, [timeLeft, onFinish]);

  // Countdown timer
  useEffect(() => {
    if (paused || finishedRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleEndGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, handleEndGame]);

  const handleLetterPress = (letter: string, index: number) => {
    if (paused || finishedRef.current) return;
    if (usedLetterIndices.includes(index)) return;

    soundManager.playSound('flip');
    haptics.impact('light');

    setCurrentWord((prev) => [...prev, letter]);
    setUsedLetterIndices((prev) => [...prev, index]);
    setMessage(null);
  };

  const handleBackspace = () => {
    if (currentWord.length === 0 || paused || finishedRef.current) return;
    haptics.impact('light');
    setCurrentWord((prev) => prev.slice(0, -1));
    setUsedLetterIndices((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (paused || finishedRef.current) return;
    haptics.impact('medium');
    setCurrentWord([]);
    setUsedLetterIndices([]);
  };

  const handleSubmit = () => {
    if (paused || finishedRef.current || currentWord.length === 0) return;

    const candidate = currentWord.join('').toUpperCase();
    const validUpper = gamePool.validWords.map((w) => w.toUpperCase());

    if (solvedWords.includes(candidate)) {
      triggerShake();
      soundManager.playSound('error');
      haptics.notification('warning');
      setMessage({ text: 'Already found!', type: 'error' });
      return;
    }

    if (validUpper.includes(candidate)) {
      // Valid word!
      const len = candidate.length;
      let pts = 100;
      if (len >= 6) pts = 800;
      else if (len === 5) pts = 400;
      else if (len === 4) pts = 200;

      const newScore = liveScore + pts;
      const newSolved = [candidate, ...solvedWords];
      wordsLogRef.current = newSolved;

      setLiveScore(newScore);
      setSolvedWords(newSolved);
      onScoreChange(newScore);

      soundManager.playSound('match');
      haptics.notification('success');
      setMessage({ text: `+${pts} pts!`, type: 'success' });

      handleClear();
    } else {
      triggerShake();
      soundManager.playSound('error');
      haptics.notification('error');
      setMessage({ text: 'Not in word list', type: 'error' });
    }
  };

  const maxButtonWidth = Math.min((width - 64) / gamePool.letters.length, 52);

  return (
    <View style={styles.container}>
      {/* HUD Bar */}
      <View style={styles.hudBar}>
        <View style={styles.hudChip}>
          <Ionicons name="time" size={14} color={timeLeft <= 10 ? '#FF5252' : colors.primary} />
          <Text style={[styles.hudValue, timeLeft <= 10 && styles.hurryText]}>{timeLeft}s</Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Words</Text>
          <Text style={styles.hudValue}>{solvedWords.length}</Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>
      </View>

      {/* Word Input Display Box */}
      <Animated.View style={[styles.inputContainer, shakeStyle]}>
        <Text style={styles.inputText}>
          {currentWord.length > 0 ? currentWord.join('') : '...'}
        </Text>
        {message && (
          <Text
            style={[
              styles.feedbackMessage,
              message.type === 'success' && styles.successMessage,
              message.type === 'error' && styles.errorMessage,
            ]}
          >
            {message.text}
          </Text>
        )}
      </Animated.View>

      {/* Available Letter Tiles */}
      <View style={styles.letterRow}>
        {gamePool.letters.map((letter, idx) => {
          const isUsed = usedLetterIndices.includes(idx);
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.letterTile,
                { width: maxButtonWidth, height: maxButtonWidth * 1.15 },
                isUsed && styles.letterTileUsed,
              ]}
              onPress={() => handleLetterPress(letter, idx)}
              disabled={isUsed}
              activeOpacity={0.7}
            >
              <Text style={[styles.letterText, isUsed && styles.letterTextUsed]}>{letter}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Controls */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleClear} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          <Text style={styles.btnSecondaryText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleBackspace} activeOpacity={0.8}>
          <Ionicons name="backspace-outline" size={18} color={colors.textMuted} />
          <Text style={styles.btnSecondaryText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={20} color="#051A10" />
          <Text style={styles.btnSubmitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Solved Words Chips List */}
      <View style={styles.solvedSection}>
        <Text style={styles.solvedTitle}>Found Words ({solvedWords.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.solvedList}>
          {solvedWords.map((word, i) => (
            <View key={i} style={styles.wordChip}>
              <Text style={styles.wordChipText}>{word}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  hudBar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  hudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  hudLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hudValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
  },
  hurryText: {
    color: '#FF5252',
  },
  inputContainer: {
    width: '100%',
    minHeight: 68,
    backgroundColor: '#071A12',
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: '#133E2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  inputText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 4,
    fontFamily: typography.fonts.heading,
  },
  feedbackMessage: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  successMessage: {
    color: '#00E676',
  },
  errorMessage: {
    color: '#FF5252',
  },
  letterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  letterTile: {
    backgroundColor: '#164E33',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#246B48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterTileUsed: {
    backgroundColor: '#0A2017',
    borderColor: '#123626',
    opacity: 0.4,
  },
  letterText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    fontFamily: typography.fonts.heading,
  },
  letterTextUsed: {
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 360,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#123626',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#1E523A',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  btnSubmit: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  btnSubmitText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#051A10',
  },
  solvedSection: {
    width: '100%',
    marginTop: spacing.md,
  },
  solvedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  solvedList: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  wordChip: {
    backgroundColor: '#123626',
    borderWidth: 1,
    borderColor: '#1E523A',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  wordChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});
