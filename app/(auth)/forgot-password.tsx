import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleReset = () => {
    if (!email) {
      showToast({ message: 'Please enter your email address.', type: 'error' });
      return;
    }
    showToast({
      message: 'Password reset link sent to your email!',
      type: 'success',
    });
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <Header title="Reset Password" showBack={true} />

      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your registered email and we will send you a recovery link.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="gamer@zyrobet.app"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <Button
            title="Send Reset Link"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleReset}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.xs + 2,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
});
