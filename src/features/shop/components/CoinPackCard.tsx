import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { CoinPack } from '@/types/shop';
import { formatCoins } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface CoinPackCardProps {
  pack: CoinPack;
  onPurchase: (pack: CoinPack) => void;
  loading?: boolean;
}

export const CoinPackCard: React.FC<CoinPackCardProps> = ({ pack, onPurchase, loading = false }) => {
  return (
    <View
      style={[
        styles.card,
        pack.isPopular && styles.cardPopular,
        pack.isBestValue && styles.cardBestValue,
        (pack.isPopular || pack.isBestValue) && shadows.goldGlow,
      ]}
    >
      {pack.tag && (
        <View style={styles.badgeWrapper}>
          <Badge
            label={pack.tag}
            variant={pack.isBestValue ? 'gold' : pack.isPopular ? 'new' : 'neutral'}
          />
        </View>
      )}

      <View style={styles.contentRow}>
        <View style={styles.coinIconWrapper}>
          <Ionicons
            name="disc"
            size={pack.isBestValue ? 32 : 26}
            color={colors.gold}
          />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.coinsRow}>
            <Text style={styles.coinsAmount}>{formatCoins(pack.totalCoins)}</Text>
            <Text style={styles.coinsLabel}> Coins</Text>
          </View>
          {pack.bonusCoins > 0 && (
            <Text style={styles.bonusText}>
              Includes +{formatCoins(pack.bonusCoins)} free bonus coins
            </Text>
          )}
        </View>

        <Button
          title={pack.priceFormatted}
          variant={pack.isBestValue ? 'gold' : 'primary'}
          size="sm"
          onPress={() => onPurchase(pack)}
          loading={loading}
          style={styles.buyBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  cardPopular: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  cardBestValue: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceAlt,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    zIndex: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 197, 66, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  coinsAmount: {
    ...typography.h3,
    fontSize: 18,
    color: colors.gold,
    fontWeight: '900',
  },
  coinsLabel: {
    ...typography.captionBold,
    color: colors.text,
  },
  bonusText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 2,
  },
  buyBtn: {
    minWidth: 80,
    marginLeft: spacing.sm,
  },
});
