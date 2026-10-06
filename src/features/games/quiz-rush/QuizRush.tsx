import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { getQuizRushQuestions, TriviaQuestion, QuizRushPayload } from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

const QUESTION_SECONDS = 8;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuizRush({ session, paused, onScoreChange, onFinish }: GameProps) {
  const [questions] = useState<TriviaQuestion[]>(() => getQuizRushQuestions(session.seed, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [liveScore, setLiveScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const answersLogRef = useRef<QuizRushPayload['answers']>([]);
  const finishedRef = useRef(false);
  const questionStartTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartTimeRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    gameStartTimeRef.current = now;
    questionStartTimeRef.current = now;
  }, []);

  const currentQ = questions[currentIndex];
  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeOffset.value = withSequence(
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 40 }),
      withTiming(-8, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
  }, [shakeOffset]);

  // Complete game
  const handleComplete = useCallback(
    (finalAnswers: QuizRushPayload['answers']) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      soundManager.playSound('win');
      haptics.notification('success');

      const totalDurationMs = Date.now() - (gameStartTimeRef.current || Date.now());
      onFinish({ answers: finalAnswers }, totalDurationMs);
    },
    [onFinish]
  );

  // Move to next question or end
  const advanceToNext = useCallback(
    (answers: QuizRushPayload['answers']) => {
      if (currentIndex + 1 >= questions.length) {
        handleComplete(answers);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setTimeLeft(QUESTION_SECONDS);
        questionStartTimeRef.current = Date.now();
      }
    },
    [currentIndex, questions.length, handleComplete]
  );

  // Handle option selection
  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (paused || isAnswerRevealed || finishedRef.current || !currentQ) return;

      const responseMs = Date.now() - (questionStartTimeRef.current || Date.now());
      setSelectedOption(optionIndex);
      setIsAnswerRevealed(true);

      const isCorrect = optionIndex === currentQ.correctIndex;
      const newAnswers = [
        ...answersLogRef.current,
        {
          questionId: currentQ.id,
          selectedIndex: optionIndex,
          responseMs,
        },
      ];
      answersLogRef.current = newAnswers;

      if (isCorrect) {
        soundManager.playSound('match');
        haptics.notification('success');
        const newStreak = streak + 1;
        setStreak(newStreak);

        const speedBonus = Math.max(0, Math.floor((QUESTION_SECONDS * 1000 - responseMs) / 100));
        const comboMultiplier = Math.min(3, 1 + newStreak * 0.2);
        const pts = Math.round((100 + speedBonus) * comboMultiplier);

        const updatedScore = liveScore + pts;
        setLiveScore(updatedScore);
        onScoreChange(updatedScore);
      } else {
        triggerShake();
        soundManager.playSound('error');
        haptics.notification('error');
        setStreak(0);
      }

      // Delay before next question
      setTimeout(() => {
        advanceToNext(newAnswers);
      }, 1000);
    },
    [paused, isAnswerRevealed, currentQ, streak, liveScore, onScoreChange, triggerShake, advanceToNext]
  );

  // Question countdown timer
  useEffect(() => {
    if (paused || isAnswerRevealed || finishedRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Timeout counts as miss (-1)
          handleSelectOption(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, isAnswerRevealed, handleSelectOption]);

  if (!currentQ) return null;

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.hudBar}>
        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Question</Text>
          <Text style={styles.hudValue}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Ionicons name="time" size={14} color={timeLeft <= 3 ? '#FF5252' : colors.primary} />
          <Text style={[styles.hudValue, timeLeft <= 3 && styles.hurryText]}>{timeLeft}s</Text>
        </View>

        <View style={styles.hudChip}>
          <Ionicons name="flame" size={14} color={streak >= 3 ? '#FF9800' : colors.textMuted} />
          <Text style={styles.hudValue}>{streak}x</Text>
        </View>
      </View>

      {/* Question Card */}
      <Animated.View style={[styles.questionCard, shakeStyle]}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{currentQ.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.questionText}>{currentQ.question}</Text>
      </Animated.View>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {currentQ.options.map((opt, idx) => {
          const isCorrect = isAnswerRevealed && idx === currentQ.correctIndex;
          const isWrong = isAnswerRevealed && idx === selectedOption && idx !== currentQ.correctIndex;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                isCorrect && styles.optionCorrect,
                isWrong && styles.optionWrong,
              ]}
              onPress={() => handleSelectOption(idx)}
              disabled={isAnswerRevealed}
              activeOpacity={0.75}
            >
              <View style={styles.optionLetterBox}>
                <Text style={styles.optionLetter}>{OPTION_LETTERS[idx]}</Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  isCorrect && styles.optionTextCorrect,
                  isWrong && styles.optionTextWrong,
                ]}
                numberOfLines={2}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    marginBottom: spacing.md,
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
  questionCard: {
    width: '100%',
    backgroundColor: '#071A12',
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: '#133E2B',
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.sm,
    minHeight: 140,
    justifyContent: 'center',
  },
  categoryPill: {
    backgroundColor: '#14382A',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#225B44',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E2A1F',
    borderWidth: 1.5,
    borderColor: '#1D4D38',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  optionLetterBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#164E33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#246B48',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionCorrect: {
    backgroundColor: '#00331A',
    borderColor: '#00E676',
  },
  optionTextCorrect: {
    color: '#00E676',
    fontWeight: '800',
  },
  optionWrong: {
    backgroundColor: '#330A0A',
    borderColor: '#FF5252',
  },
  optionTextWrong: {
    color: '#FF5252',
    fontWeight: '800',
  },
});
