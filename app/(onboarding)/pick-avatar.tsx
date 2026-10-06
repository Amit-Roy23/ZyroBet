import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { hapticFeedback } from '@/lib/haptics';

const AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
];

export default function PickAvatarScreen() {
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const { user, setUser, setIsOnboarded } = useAuthStore();

  const handleFinish = () => {
    if (user) {
      setUser({ ...user, avatarUrl: selectedAvatar });
    }
    setIsOnboarded(true);
    router.replace('/(tabs)/home');
  };

  return (
    <Screen style={styles.container}>
      <Header title="Choose Your Avatar" showBack={true} />

      <View style={styles.content}>
        <Text style={styles.subtitle}>Pick your gamer portrait to display on leaderboards.</Text>

        <View style={styles.avatarGrid}>
          {AVATARS.map((url, i) => {
            const isSelected = selectedAvatar === url;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedAvatar(url);
                }}
                style={[
                  styles.avatarWrapper,
                  isSelected && styles.avatarSelected,
                  isSelected && shadows.greenGlow,
                ]}
              >
                <Image source={{ uri: url }} style={styles.avatarImage} contentFit="cover" />
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="#07140F" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Enter ZyroBet"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleFinish}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    maxWidth: 320,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 2,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },
  avatarSelected: {
    borderColor: colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  footer: {
    padding: spacing.lg,
  },
});
