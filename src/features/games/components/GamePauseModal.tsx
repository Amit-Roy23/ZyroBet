import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

interface GamePauseModalProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function GamePauseModal({
  visible,
  onResume,
  onRestart,
  onQuit,
}: GamePauseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Game Paused</Text>
          <Text style={styles.subtitle}>Take a breath. Timer is paused.</Text>

          <View style={styles.buttonList}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={onResume}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color="#051A10" />
              <Text style={styles.btnPrimaryText}>Resume Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onRestart}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color={colors.text} />
              <Text style={styles.btnSecondaryText}>Restart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={onQuit}
              activeOpacity={0.8}
            >
              <Ionicons name="home" size={18} color="#FF5252" />
              <Text style={styles.btnDangerText}>Quit to Lobby</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0E2A1F',
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: '#1D4D38',
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    fontFamily: typography.fonts.heading,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  buttonList: {
    width: '100%',
    gap: spacing.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: '#051A10',
    fontSize: 16,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: '#164E33',
    borderWidth: 1,
    borderColor: '#226346',
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  btnDangerText: {
    color: '#FF5252',
    fontSize: 15,
    fontWeight: '700',
  },
});
