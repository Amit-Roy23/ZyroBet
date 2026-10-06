import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography } from '@/theme';
import { soundManager } from '@/lib/audio';
import { haptics } from '@/lib/haptics';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState<number | string>(3);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    soundManager.playSound('countdown');
    haptics.impact('light');

    scale.value = withSequence(
      withTiming(0.5, { duration: 0 }),
      withSpring(1.2, { damping: 8 }),
      withTiming(1, { duration: 200 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );

    const timer1 = setTimeout(() => {
      setCount(2);
      soundManager.playSound('countdown');
      haptics.impact('light');
      scale.value = withSequence(withTiming(0.5, { duration: 0 }), withSpring(1.2, { damping: 8 }));
      opacity.value = withSequence(withTiming(1, { duration: 150 }), withTiming(1, { duration: 600 }), withTiming(0, { duration: 200 }));
    }, 1000);

    const timer2 = setTimeout(() => {
      setCount(1);
      soundManager.playSound('countdown');
      haptics.impact('light');
      scale.value = withSequence(withTiming(0.5, { duration: 0 }), withSpring(1.2, { damping: 8 }));
      opacity.value = withSequence(withTiming(1, { duration: 150 }), withTiming(1, { duration: 600 }), withTiming(0, { duration: 200 }));
    }, 2000);

    const timer3 = setTimeout(() => {
      setCount('GO!');
      soundManager.playSound('win');
      haptics.impact('medium');
      scale.value = withSequence(withTiming(0.5, { duration: 0 }), withSpring(1.4, { damping: 6 }));
      opacity.value = withSequence(withTiming(1, { duration: 150 }), withTiming(1, { duration: 400 }), withTiming(0, { duration: 200 }));
    }, 3000);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, [onComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.Text style={[styles.countdownText, animatedStyle]}>
        {count}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 26, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  countdownText: {
    fontSize: 90,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
    textShadowColor: colors.primaryMuted,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
