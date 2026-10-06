import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { formatCoins } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';

export interface CoinBalanceCardProps {
  balance: number;
  onGetMoreCoins?: () => void;
}

export const CoinBalanceCard: React.FC<CoinBalanceCardProps> = ({
  balance,
  onGetMoreCoins,
}) => {
  const handleGetCoins = () => {
    if (onGetMoreCoins) {
      onGetMoreCoins();
    } else {
      router.push('/(tabs)/shop');
    }
  };

  return (
    <LinearGradient
      colors={gradients.surface}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, shadows.goldGlow]}
    >
      <View style={styles.topRow}>
        <View style={styles.coinBadge}>
          <Ionicons name="disc" size={28} color={colors.gold} />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.label}>VIRTUAL COIN BALANCE</Text>
          <Text style={styles.balanceText}>{formatCoins(balance)}</Text>
        </View>
        <Button
          title="Get Coins"
          variant="gold"
          size="sm"
          onPress={handleGetCoins}
          leftIcon={<Ionicons name="add-circle" size={16} color="#07140F" />}
        />
      </View>
      <View style={styles.legalDisclaimerRow}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
        <Text style={styles.disclaimerText}>
          Virtual entertainment coins only. No cash value.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: 'rgba(245, 197, 66, 0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    ...typography.micro,
    color: colors.goldLight,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  balanceText: {
    ...typography.h2,
    color: colors.gold,
    fontWeight: '900',
    fontSize: 22,
  },
  legalDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 197, 66, 0.2)',
    gap: 4,
  },
  disclaimerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
});
