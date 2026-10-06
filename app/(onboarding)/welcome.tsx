import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { APP_CONFIG } from '@/constants/config';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const handleContinue = () => {
    router.push('/(onboarding)/pick-avatar');
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.heroSection}>
        <LinearGradient
          colors={gradients.tabRaisedButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.logoCircle, shadows.greenGlow]}
        >
          <Ionicons name="game-controller" size={48} color="#07140F" />
        </LinearGradient>

        <Text style={styles.title}>{APP_CONFIG.APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_CONFIG.APP_SLOGAN}</Text>

        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Ionicons name="flash" size={18} color={colors.primary} />
            <Text style={styles.featureText}>Fast skill mini-games: 2048, Memory, Reflex & Quiz</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="disc" size={18} color={colors.gold} />
            <Text style={styles.featureText}>1,000 Starting Virtual Coins on signup</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primaryLight} />
            <Text style={styles.featureText}>{APP_CONFIG.LEGAL_DISCLAIMER}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Get Started"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}
          rightIcon={<Ionicons name="arrow-forward" size={18} color="#07140F" />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    fontSize: 34,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featureList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.md,
    width: '100%',
    gap: spacing.sm + 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomSection: {
    paddingBottom: spacing.md,
  },
});
