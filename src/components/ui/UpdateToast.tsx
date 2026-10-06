import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppUpdates } from '@/lib/updates';
import { colors, radii, spacing, typography, shadows } from '@/theme';

export const UpdateNotificationToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isUpdateReady, restartApp } = useAppUpdates();

  if (!isUpdateReady) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { top: Math.max(insets.top + 8, 16) },
        shadows.greenGlow,
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name="cloud-download-outline" size={20} color={colors.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Update Ready</Text>
          <Text style={styles.subtitle}>Restart now to apply changes</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={restartApp}
          style={styles.restartButton}
        >
          <Text style={styles.restartText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 10000,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  icon: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 13,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  restartButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    marginLeft: spacing.sm,
  },
  restartText: {
    ...typography.captionBold,
    color: colors.textInverse,
    fontWeight: '700',
  },
});
