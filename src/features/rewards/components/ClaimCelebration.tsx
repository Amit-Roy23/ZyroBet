import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useRewardsStore } from '../store/useRewardsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 18;

export interface ClaimCelebrationProps {
  visible: boolean;
  coins: number;
  isDay7?: boolean;
  origin?: { x: number; y: number };
  target?: { x: number; y: number };
  onComplete: () => void;
}

interface ParticleConfig {
  id: number;
  angle: number;
  speed: number;
  burstDistance: number;
  delayMs: number;
  size: number;
}

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = (index / PARTICLE_COUNT) * 2 * Math.PI - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 100;
    const burstDistance = 60 + Math.random() * 80;
    const delayMs = Math.random() * 80;
    const size = 16 + Math.floor(Math.random() * 8);

    return { id: index, angle, speed, burstDistance, delayMs, size };
  });
}

const CoinParticle: React.FC<{
  config: ParticleConfig;
  progress: SharedValue<number>;
  origin: { x: number; y: number };
  target: { x: number; y: number };
}> = ({ config, progress, origin, target }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;

    let currentX = origin.x;
    let currentY = origin.y;
    let opacity = 1;
    let scale = 1;

    if (p < 0.4) {
      const burstProgress = p / 0.4;
      const ease = 1 - Math.pow(1 - burstProgress, 2);
      currentX += Math.cos(config.angle) * config.burstDistance * ease;
      currentY += Math.sin(config.angle) * config.burstDistance * ease + 20 * (burstProgress * burstProgress);
      scale = 0.5 + 0.7 * ease;
    } else {
      const flyProgress = (p - 0.4) / 0.6;
      const burstX = origin.x + Math.cos(config.angle) * config.burstDistance;
      const burstY = origin.y + Math.sin(config.angle) * config.burstDistance + 20;

      const ease = Math.pow(flyProgress, 2.5);
      currentX = burstX + (target.x - burstX) * ease;
      currentY = burstY + (target.y - burstY) * ease;

      if (flyProgress > 0.8) {
        opacity = 1 - (flyProgress - 0.8) / 0.2;
        scale = 1.2 * (1 - (flyProgress - 0.8) / 0.2);
      }
    }

    return {
      transform: [
        { translateX: currentX - config.size / 2 },
        { translateY: currentY - config.size / 2 },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Ionicons name="disc" size={config.size} color={colors.gold} />
    </Animated.View>
  );
};

export const ClaimCelebration: React.FC<ClaimCelebrationProps> = ({
  visible,
  coins: _coins,
  isDay7 = false,
  origin = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
  target = { x: SCREEN_WIDTH - 60, y: 50 },
  onComplete,
}) => {
  const isReducedMotion = useReducedMotion();
  const { soundEnabled, hapticsEnabled } = useRewardsStore();
  const animationProgress = useSharedValue(0);
  const [particles] = useState<ParticleConfig[]>(generateParticles);

  useEffect(() => {
    if (!visible) return;

    if (hapticsEnabled) {
      if (isDay7) {
        hapticFeedback.heavy();
      } else {
        hapticFeedback.light();
      }
    }

    if (soundEnabled) {
      soundManager.playSound('coin');
    }

    if (isReducedMotion) {
      const timer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    animationProgress.value = 0;
    animationProgress.value = withSequence(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      withDelay(
        50,
        withTiming(1, { duration: 50 }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        }),
      ),
    );

    const landTimer = setTimeout(() => {
      if (hapticsEnabled) {
        hapticFeedback.success();
      }
    }, 950);

    return () => clearTimeout(landTimer);
  }, [visible, isDay7, isReducedMotion, hapticsEnabled, soundEnabled, animationProgress, onComplete]);

  if (!visible || isReducedMotion) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle) => (
        <CoinParticle
          key={particle.id}
          config={particle}
          progress={animationProgress}
          origin={origin}
          target={target}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
});
