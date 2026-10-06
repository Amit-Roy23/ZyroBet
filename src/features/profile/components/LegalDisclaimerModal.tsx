import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { APP_CONFIG } from '@/constants/config';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface LegalDisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LegalDisclaimerModal: React.FC<LegalDisclaimerModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal visible={visible} onClose={onClose} title="Legal Notice & Policy">
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.highlightBox}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.highlightTitle}>{APP_CONFIG.LEGAL_DISCLAIMER}</Text>
        </View>

        <Text style={styles.paragraph}>{APP_CONFIG.LEGAL_FULL_TEXT}</Text>

        <View style={styles.bulletSection}>
          <Text style={styles.bulletTitle}>Core Platform Rules:</Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.bold}>Zero Cash Value:</Text> All coins, rewards, and balances
            within {APP_CONFIG.APP_NAME} are virtual points intended exclusively for gameplay
            progression and cosmetic fun.
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.bold}>No Withdrawals or Cash-Outs:</Text> Virtual coins can never
            be redeemed, traded, transferred to other players, or exchanged for fiat currency or
            tangible prizes.
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.bold}>Pure Skill Mini-Games:</Text> Every game is skill-based
            (memory, puzzles, reaction timing, trivia, runners). There are zero casino-style
            elements, betting systems, or odds-based loot boxes.
          </Text>
        </View>
      </ScrollView>

      <Button
        title="I Understand"
        variant="primary"
        size="md"
        onPress={onClose}
        style={styles.closeBtn}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 320,
    marginBottom: spacing.md,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  highlightTitle: {
    ...typography.bodyBold,
    color: colors.primaryLight,
    flex: 1,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  bulletSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulletTitle: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bulletItem: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
    lineHeight: 18,
  },
  bold: {
    color: colors.text,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: spacing.xs,
  },
});
