import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { APP_CONFIG } from '@/constants/config';

export default function NativeCheckWebScreen() {
  const [browserInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        userAgent: navigator.userAgent,
        hasLocalStorage: typeof window.localStorage !== 'undefined',
        hasWakeLock: 'wakeLock' in navigator,
        hasAudioContext: typeof (window.AudioContext || (window as any).webkitAudioContext) !== 'undefined',
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      };
    }
    return {
      userAgent: '',
      hasLocalStorage: false,
      hasWakeLock: false,
      hasAudioContext: false,
      screenWidth: 0,
      screenHeight: 0,
    };
  });

  return (
    <Screen scrollable style={styles.container}>
      <Header
        title="Web Diagnostics"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.noticeCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="globe-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.noticeTitle}>Web Platform Environment</Text>
          <Text style={styles.noticeBody}>
            Full Native Smoke Testing (Nitro MMKV C++, RevenueCat StoreKit/Google Play Billing,
            Apple Authentication, Google Sign-In SDK, and expo-notifications) is designed for
            iOS and Android development builds.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Browser Capabilities</Text>

        <View style={styles.group}>
          <View style={styles.row}>
            <Text style={styles.label}>App Name</Text>
            <Text style={styles.value}>{APP_CONFIG.APP_NAME}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Web Bundler</Text>
            <Text style={styles.badgeSuccess}>Metro Web (SPA)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>LocalStorage MMKV Fallback</Text>
            <Text style={browserInfo.hasLocalStorage ? styles.badgeSuccess : styles.badgeFail}>
              {browserInfo.hasLocalStorage ? 'ACTIVE' : 'UNAVAILABLE'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Web Audio API</Text>
            <Text style={browserInfo.hasAudioContext ? styles.badgeSuccess : styles.badgeFail}>
              {browserInfo.hasAudioContext ? 'AVAILABLE' : 'UNAVAILABLE'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Screen Wake Lock API</Text>
            <Text style={browserInfo.hasWakeLock ? styles.badgeSuccess : styles.badgeMuted}>
              {browserInfo.hasWakeLock ? 'AVAILABLE' : 'NOT SUPPORTED'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Viewport</Text>
            <Text style={styles.value}>
              {browserInfo.screenWidth} × {browserInfo.screenHeight} px
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Return to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 60,
  },
  noticeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noticeBody: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    ...typography.captionBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  value: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  badgeSuccess: {
    ...typography.captionBold,
    color: colors.primary,
    backgroundColor: `${colors.primary}18`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeMuted: {
    ...typography.captionBold,
    color: colors.textMuted,
    backgroundColor: `${colors.border}`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeFail: {
    ...typography.captionBold,
    color: colors.danger,
    backgroundColor: `${colors.danger}18`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  backButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
});
