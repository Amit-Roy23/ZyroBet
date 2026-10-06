import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { SettingsItem } from '@/features/profile/components/SettingsItem';
import { LegalDisclaimerModal } from '@/features/profile/components/LegalDisclaimerModal';
import { CoinBalanceCard } from '@/features/wallet/components/CoinBalanceCard';
import { CoinChip } from '@/features/wallet/components/CoinChip';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useWalletStore } from '@/features/wallet/store/useWalletStore';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { walletApi } from '@/features/wallet/api';
import { soundManager } from '@/lib/audio';
import { useToast } from '@/components/ui/Toast';
import { APP_CONFIG } from '@/constants/config';
import { hapticFeedback } from '@/lib/haptics';
import { useRewardsStore } from '@/features/rewards/store/useRewardsStore';
import { DailyRemindersSettings } from '@/features/rewards/components/DailyRemindersSettings';

export default function AccountScreen() {
  const { user, signOut } = useAuthStore();
  const { balance } = useWallet();
  const { showToast } = useToast();

  const {
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
  } = useRewardsStore();

  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isGranting, setIsGranting] = useState(false);

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    soundManager.setEnabled(val);
    showToast({ message: val ? 'Sound effects enabled' : 'Sound effects muted', type: 'info' });
  };

  const handleHapticsToggle = (val: boolean) => {
    setHapticsEnabled(val);
    showToast({ message: val ? 'Haptics enabled' : 'Haptics disabled', type: 'info' });
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/(auth)/sign-in');
  };

  const handleDevGrant = async () => {
    if (isGranting) return;
    setIsGranting(true);
    hapticFeedback.medium();

    try {
      const res = await walletApi.devGrant();
      if (res.error) {
        // Fallback simulate local dev grant when Edge Functions are offline
        const simulatedBalance = balance + 100;
        useWalletStore.getState().setBalance(simulatedBalance);
        showToast({
          message: `Dev Grant: +100 Coins (Local)! Total: ${simulatedBalance}`,
          type: 'success',
        });
      } else {
        useWalletStore.getState().setBalance(res.balance);
        showToast({
          message: `Dev Grant: +100 Coins applied! Total: ${res.balance}`,
          type: 'success',
        });
      }
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <Screen scrollable style={styles.container}>
      <Header
        title="My Account"
        showBack={false}
        rightElement={<CoinChip balance={balance} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        {user && <ProfileHeader user={user} />}

        {/* Coin Balance & Quick Shop */}
        <CoinBalanceCard balance={balance} />

        {/* Developer Tools (DEV ONLY) */}
        {(__DEV__ || process.env.EXPO_PUBLIC_DEV_TOOLS === 'true') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Tools</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="shield-checkmark-outline"
                iconColor={colors.primary}
                title="Native Smoke Test"
                subtitle="Verify all SDK 57 native modules, OTA runtime & permissions"
                onPress={() => router.push('/dev/native-check')}
              />
              <SettingsItem
                icon="construct-outline"
                iconColor={colors.warning}
                title="Grant 100 Coins"
                subtitle="Test Reanimated counter animation & live ledger update"
                onPress={handleDevGrant}
              />
              <SettingsItem
                icon="time-outline"
                iconColor={colors.gold}
                title="View Coin Ledger History"
                subtitle="Open the transaction history screen"
                onPress={() => router.push('/wallet/history')}
              />
            </View>
          </View>
        )}

        {/* Daily Reminders Section - hidden on web via platform-specific component */}
        <DailyRemindersSettings />

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="volume-high"
              title="Sound Effects"
              isSwitch
              switchValue={soundEnabled}
              onSwitchToggle={handleSoundToggle}
            />
            <SettingsItem
              icon="phone-portrait"
              title="Haptic Vibrations"
              isSwitch
              switchValue={hapticsEnabled}
              onSwitchToggle={handleHapticsToggle}
            />
            <SettingsItem
              icon="trophy"
              iconColor={colors.gold}
              title="Global Leaderboards"
              subtitle="View top ranks across all games"
              onPress={() => router.push('/leaderboard')}
            />
          </View>
        </View>

        {/* Legal & Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance & Rules</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="shield-checkmark"
              iconColor={colors.primary}
              title="No Gambling Policy"
              subtitle="Virtual coins only. No real-money gambling."
              onPress={() => setShowLegalModal(true)}
            />
            <SettingsItem
              icon="document-text"
              title="Terms of Service"
              onPress={() => setShowLegalModal(true)}
            />
            <SettingsItem
              icon="lock-closed"
              title="Privacy Policy"
              onPress={() => setShowLegalModal(true)}
            />
          </View>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="log-out-outline"
              title="Sign Out / Reset Session"
              danger
              onPress={handleSignOut}
            />
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>
            {APP_CONFIG.APP_NAME} v{APP_CONFIG.APP_VERSION} ({APP_CONFIG.BUILD_NUMBER})
          </Text>
          <Text style={styles.legalFooterText}>{APP_CONFIG.LEGAL_DISCLAIMER}</Text>
        </View>
      </ScrollView>

      <LegalDisclaimerModal
        visible={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  section: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsGroup: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  legalFooterText: {
    ...typography.micro,
    color: colors.textSubtle,
    marginTop: 4,
  },
});
