import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '@/theme';
import { formatNumber } from '@/utils/format';
import { CasinoMode } from '../types';

interface CasinoShellProps {
  title: string;
  balance: number;
  mode: CasinoMode;
  onBack: () => void;
  children: React.ReactNode;
}

/** Top bar (back, title, balance, demo badge) and a scrollable body shared by all casino games. */
export function CasinoShell({ title, balance, mode, onBack, children }: CasinoShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {mode === 'demo' && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>DEMO COINS</Text>
            </View>
          )}
        </View>

        <View style={styles.balance} accessibilityLabel={`Balance ${balance} coins`}>
          <Ionicons name="disc" size={14} color={colors.gold} />
          <Text style={styles.balanceText}>{formatNumber(balance)}</Text>
        </View>
      </View>

      {mode === 'checking' ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
          <Text style={styles.disclaimer}>
            Virtual coins only. Coins have no cash value and cannot be withdrawn or exchanged.
            {mode === 'demo' ? ' Demo mode: sign in to play with your wallet.' : ''}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: typography.fonts.heading,
  },
  demoBadge: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.warningMuted,
  },
  demoText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warning,
    letterSpacing: 0.5,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 42,
    paddingHorizontal: spacing.sm,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.goldMuted,
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  disclaimer: {
    marginTop: spacing.sm,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
