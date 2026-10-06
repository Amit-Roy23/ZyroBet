import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { CoinChip } from '@/components/ui/CoinChip';
import { CoinPackCard } from '@/features/shop/components/CoinPackCard';
import { LegalNoticeBanner } from '@/features/shop/components/LegalNoticeBanner';
import { COIN_PACKS } from '@/features/shop/constants/coinPacks';
import { useWalletStore } from '@/features/wallet/store/useWalletStore';
import { useToast } from '@/components/ui/Toast';
import { CoinPack } from '@/types/shop';
import { formatCoins } from '@/utils/format';
import { canPurchase } from '@/features/shop/services/purchases';

export default function ShopScreen() {
  const { balance, creditCoins } = useWalletStore();
  const { showToast } = useToast();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = (pack: CoinPack) => {
    setPurchasingId(pack.id);
    setTimeout(() => {
      creditCoins(
        pack.totalCoins,
        'iap_purchase',
        `Purchased ${formatCoins(pack.totalCoins)} Coins Pack`,
      );
      setPurchasingId(null);
      showToast({
        message: `Success! +${formatCoins(pack.totalCoins)} Coins added to your wallet.`,
        type: 'coin',
      });
    }, 800);
  };

  return (
    <Screen scrollable style={styles.container}>
      <Header
        title="Coin Shop"
        showBack={false}
        rightElement={<CoinChip balance={balance} showAddButton={false} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hard Legal Notice Banner */}
        <LegalNoticeBanner />

        {canPurchase ? (
          <>
            {/* Coin Packs Section */}
            <View style={styles.sectionHeader}>
              <Ionicons name="cart" size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>Virtual Coin Bundles</Text>
            </View>

            {COIN_PACKS.map((pack) => (
              <CoinPackCard
                key={pack.id}
                pack={pack}
                onPurchase={handlePurchase}
                loading={purchasingId === pack.id}
              />
            ))}

            <Text style={styles.footerDisclaimer}>
              In-app purchases are billed to your App Store / Google Play account. Virtual coins are
              for gameplay in ZyroBet only and are non-refundable.
            </Text>
          </>
        ) : (
          /* Web Platform fallback panel */
          <View style={styles.webFallbackCard}>
            <View style={styles.webFallbackIconWrapper}>
              <Ionicons name="phone-portrait-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.webFallbackTitle}>Get the App to Buy Coins</Text>
            <Text style={styles.webFallbackDescription}>
              In-app coin purchases are processed securely through Apple App Store and Google Play
              Billing. Download the ZyroBet mobile app on iOS or Android to top up your coin wallet!
            </Text>

            <View style={styles.webFeatureList}>
              <View style={styles.webFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.webFeatureText}>100% Free Virtual Entertainment</Text>
              </View>
              <View style={styles.webFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.webFeatureText}>Claim Free Coins Daily in Rewards</Text>
              </View>
              <View style={styles.webFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.webFeatureText}>Cross-Platform Cloud Wallet Sync</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rewardsButton}
              onPress={() => router.push('/(tabs)/rewards')}
              activeOpacity={0.8}
            >
              <Ionicons name="gift-outline" size={18} color={colors.bg} />
              <Text style={styles.rewardsButtonText}>Claim Free Daily Coins</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontSize: 18,
  },
  footerDisclaimer: {
    ...typography.caption,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  webFallbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  webFallbackIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  webFallbackTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  webFallbackDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  webFeatureList: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  webFeatureText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 13,
  },
  rewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    width: '100%',
  },
  rewardsButtonText: {
    ...typography.bodyBold,
    color: colors.bg,
    fontSize: 15,
  },
});
