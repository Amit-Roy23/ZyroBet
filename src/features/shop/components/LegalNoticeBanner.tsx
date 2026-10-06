import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { APP_CONFIG } from '@/constants/config';

export const LegalNoticeBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{APP_CONFIG.LEGAL_DISCLAIMER}</Text>
        <Text style={styles.description}>
          Virtual coins are strictly for in-app entertainment and gameplay only. Coins cannot be
          redeemed, withdrawn, or exchanged for real currency.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.25)',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.captionBold,
    color: colors.primaryLight,
    fontSize: 13,
    marginBottom: 2,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
});
