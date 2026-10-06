import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { APP_CONFIG } from '@/constants/config';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInAsGuest } = useAuth();

  const handleGuestPlay = () => {
    signInAsGuest();
    router.replace('/(tabs)/home');
  };

  const handleSignIn = () => {
    // Standard sign-in handler
    signInAsGuest();
    router.replace('/(tabs)/home');
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <Ionicons name="game-controller" size={32} color="#07140F" />
        </LinearGradient>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to save your game scores and coin balance</Text>
      </View>

      {/* Instant Guest Play Option (Recommended first) */}
      <View style={styles.guestCard}>
        <View style={styles.guestInfo}>
          <Ionicons name="flash" size={24} color={colors.gold} />
          <View style={styles.guestTextCol}>
            <Text style={styles.guestTitle}>Instant Guest Play</Text>
            <Text style={styles.guestSubtitle}>Jump right in with 1,000 Starting Coins</Text>
          </View>
        </View>
        <Button
          title="Play as Guest"
          variant="gold"
          size="md"
          fullWidth
          onPress={handleGuestPlay}
        />
      </View>

      <View style={styles.dividerRow}>
        <Divider style={styles.dividerLine} />
        <Text style={styles.dividerText}>or sign in with email</Text>
        <Divider style={styles.dividerLine} />
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="gamer@zyrobet.app"
              placeholderTextColor={colors.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              style={styles.input}
            />
          </View>
        </View>

        <Button
          title="Sign In"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSignIn}
          style={styles.signInBtn}
        />

        <View style={styles.footerLinks}>
          <Link href="/(auth)/forgot-password" style={styles.linkText}>
            Forgot Password?
          </Link>
          <Text style={styles.dot}>•</Text>
          <Link href="/(auth)/sign-up" style={styles.linkText}>
            Create Account
          </Link>
        </View>
      </View>

      {/* Legal Footer Note */}
      <Text style={styles.legalNote}>{APP_CONFIG.LEGAL_DISCLAIMER}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  guestCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  guestTextCol: {
    flex: 1,
  },
  guestTitle: {
    ...typography.h4,
    color: colors.gold,
  },
  guestSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.xs + 2,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  signInBtn: {
    marginTop: spacing.xs,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  linkText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  dot: {
    color: colors.textMuted,
  },
  legalNote: {
    ...typography.micro,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
