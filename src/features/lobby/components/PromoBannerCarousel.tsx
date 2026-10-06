import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { PromoBanner, PROMO_BANNERS } from '@/constants/gameCatalog';
import { getBannerSource } from '@/constants/gameAssets';
import { APP_CONFIG } from '@/constants/config';
import { Badge } from '@/components/ui/Badge';
import { hapticFeedback } from '@/lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const BANNER_HEIGHT = 160;

export const PromoBannerCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const banners = PROMO_BANNERS;

  useEffect(() => {
    const timer = setInterval(() => {
      if (banners.length === 0) return;
      const nextIndex = (activeIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * (BANNER_WIDTH + spacing.sm),
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, APP_CONFIG.CAROUSEL_AUTO_PLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeIndex, banners.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (BANNER_WIDTH + spacing.sm));
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner: PromoBanner) => {
    hapticFeedback.light();
    router.push(banner.actionRoute as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + spacing.sm}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={handleScroll}
      >
        {banners.map((banner) => (
          <Pressable
            key={banner.id}
            onPress={() => handleBannerPress(banner)}
            style={[styles.bannerCard, shadows.cardElevated]}
          >
            {/* Background Image */}
            <Image
              source={getBannerSource(banner.id, banner.imageUrl)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />

            {/* Gradient Dark Overlay */}
            <LinearGradient
              colors={gradients.overlayDark}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Banner Content */}
            <View style={styles.bannerBody}>
              <Badge label={banner.badge} variant="gold" style={styles.badge} />
              <Text style={styles.title} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {banner.subtitle}
              </Text>
              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{banner.buttonText}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Indicator Dots */}
      <View style={styles.dotsContainer}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'flex-end',
  },
  bannerBody: {
    padding: spacing.md,
    zIndex: 2,
  },
  badge: {
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs + 2,
    maxWidth: '85%',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    ...typography.micro,
    fontSize: 11,
    color: '#07140F',
    fontWeight: '900',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 18,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: colors.borderLight,
  },
});
