import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  getSoundMatchSequence,
  SoundMatchPayload,
  MAX_ROUNDS,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

const PADS_CONFIG = [
  { id: 0, name: 'Emerald', color: '#00E676', bg: '#0A331E', icon: 'musical-note' as const },
  { id: 1, name: 'Cyan', color: '#00E5FF', bg: '#0A2D33', icon: 'pulse' as const },
  { id: 2, name: 'Amber', color: '#FFD700', bg: '#332B0A', icon: 'flash' as const },
  { id: 3, name: 'Violet', color: '#E040FB', bg: '#300A33', icon: 'radio' as const },
];

export function EchoBeat({ session, paused, onScoreChange, onFinish }: GameProps) {
  const { width } = useWindowDimensions();
  const [roundSequences] = useState<number[][]>(() => getSoundMatchSequence(session.seed, MAX_ROUNDS));

  const [currentRound, setCurrentRound] = useState(0); // 0-indexed (Round 1)
  const [playerStep, setPlayerStep] = useState(0);
  const [activeLitPad, setActiveLitPad] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(true);
  const [liveScore, setLiveScore] = useState(0);
  const [statusText, setStatusText] = useState('Listen to sequence...');

  const actionsLogRef = useRef<SoundMatchPayload['actions']>([]);
  const finishedRef = useRef(false);
  const gameStartRef = useRef(0);

  useEffect(() => {
    gameStartRef.current = Date.now();
  }, []);

  const padDimension = Math.min((width - 64) / 2, 140);

  // Finish game callback
  const handleEnd = useCallback(
    (won: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      if (won) {
        soundManager.playSound('win');
        haptics.notification('success');
      } else {
        soundManager.playSound('error');
        haptics.notification('error');
      }

      const durationMs = Date.now() - (gameStartRef.current || Date.now());
      onFinish(
        {
          roundsCompleted: currentRound,
          totalNotesMatched: actionsLogRef.current.length,
          actions: actionsLogRef.current,
        },
        durationMs
      );
    },
    [currentRound, onFinish]
  );

  // Playback sequence to player
  const playSequence = useCallback(
    (seq: number[]) => {
      setIsPlayingSequence(true);
      setStatusText('Listen closely...');
      setPlayerStep(0);

      seq.forEach((padIndex, stepIdx) => {
        setTimeout(() => {
          if (finishedRef.current) return;
          setActiveLitPad(padIndex);
          soundManager.playSound('flip');
          haptics.impact('light');

          setTimeout(() => {
            setActiveLitPad(null);
            if (stepIdx === seq.length - 1) {
              setIsPlayingSequence(false);
              setStatusText('Your turn! Repeat sequence');
            }
          }, 400);
        }, (stepIdx + 1) * 700);
      });
    },
    []
  );

  // Start round on load & round change
  useEffect(() => {
    if (paused || finishedRef.current) return;
    const targetSeq = roundSequences[currentRound];
    if (targetSeq) {
      const timer = setTimeout(() => {
        playSequence(targetSeq);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentRound, paused, roundSequences, playSequence]);

  // Handle user tapping pad
  const handlePadPress = useCallback(
    (padIndex: number) => {
      if (paused || isPlayingSequence || finishedRef.current) return;

      const expectedSeq = roundSequences[currentRound];
      if (!expectedSeq) return;

      setActiveLitPad(padIndex);
      soundManager.playSound('match');
      haptics.impact('medium');

      setTimeout(() => {
        setActiveLitPad(null);
      }, 250);

      actionsLogRef.current.push({
        round: currentRound + 1,
        padIndex,
        timestamp: Date.now() - (gameStartRef.current || Date.now()),
      });

      if (padIndex === expectedSeq[playerStep]) {
        // Correct note!
        const pts = 50;
        const newScore = liveScore + pts;
        setLiveScore(newScore);
        onScoreChange(newScore);

        const nextStep = playerStep + 1;
        if (nextStep >= expectedSeq.length) {
          // Round Complete!
          const roundBonus = (currentRound + 1) * 200;
          const totalRoundScore = newScore + roundBonus;
          setLiveScore(totalRoundScore);
          onScoreChange(totalRoundScore);

          soundManager.playSound('win');
          haptics.notification('success');

          if (currentRound + 1 >= roundSequences.length) {
            // Beat all rounds!
            handleEnd(true);
          } else {
            setStatusText(`Round ${currentRound + 1} Complete! +${roundBonus} pts`);
            setIsPlayingSequence(true);
            setTimeout(() => {
              setCurrentRound((r) => r + 1);
            }, 1200);
          }
        } else {
          setPlayerStep(nextStep);
        }
      } else {
        // Mistake! Game over
        setStatusText('Wrong note!');
        handleEnd(false);
      }
    },
    [paused, isPlayingSequence, roundSequences, currentRound, playerStep, liveScore, onScoreChange, handleEnd]
  );

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.hudBar}>
        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Round</Text>
          <Text style={styles.hudValue}>
            {currentRound + 1}/{roundSequences.length}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Notes</Text>
          <Text style={styles.hudValue}>
            {playerStep}/{roundSequences[currentRound]?.length || 0}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>
      </View>

      {/* Status Prompt Message */}
      <View style={styles.statusBox}>
        <Text style={[styles.statusText, isPlayingSequence && styles.statusListening]}>
          {statusText}
        </Text>
      </View>

      {/* 2x2 Sound Pads Launchpad */}
      <View style={styles.padsGrid}>
        {PADS_CONFIG.map((pad) => {
          const isLit = activeLitPad === pad.id;
          return (
            <TouchableOpacity
              key={pad.id}
              style={[
                styles.soundPad,
                {
                  width: padDimension,
                  height: padDimension,
                  backgroundColor: isLit ? pad.color : pad.bg,
                  borderColor: isLit ? '#FFFFFF' : pad.color,
                },
                isLit && styles.soundPadLit,
              ]}
              onPress={() => handlePadPress(pad.id)}
              disabled={isPlayingSequence}
              activeOpacity={0.8}
            >
              <Ionicons
                name={pad.icon}
                size={38}
                color={isLit ? '#051A10' : pad.color}
              />
              <Text style={[styles.padName, isLit && styles.padNameLit]}>{pad.name}</Text>
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
    marginBottom: spacing.xs,
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
  statusBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: '#071A12',
    borderWidth: 1,
    borderColor: '#133E2B',
    marginVertical: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  statusListening: {
    color: colors.gold,
  },
  padsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    maxWidth: 340,
    marginBottom: spacing.md,
  },
  soundPad: {
    borderRadius: radii.xxl,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  soundPadLit: {
    shadowColor: '#FFF',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  padName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  padNameLit: {
    color: '#051A10',
  },
});
