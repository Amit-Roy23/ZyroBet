import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { LOBBY_CATEGORIES } from '@/constants/gameCatalog';
import { Chip } from '@/components/ui/Chip';

export interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (iconName: string, isSelected: boolean) => {
    const iconColor = isSelected ? '#07140F' : colors.textMuted;
    const size = 15;

    switch (iconName) {
      case 'flame':
        return <Ionicons name="flame" size={size} color={isSelected ? '#07140F' : colors.danger} />;
      case 'puzzle':
        return <Ionicons name="extension-puzzle" size={size} color={iconColor} />;
      case 'gamepad-2':
        return <Ionicons name="game-controller" size={size} color={iconColor} />;
      case 'help-circle':
        return <Ionicons name="help-circle" size={size} color={iconColor} />;
      case 'trophy':
        return <Ionicons name="trophy" size={size} color={isSelected ? '#07140F' : colors.gold} />;
      case 'casino':
        return <Ionicons name="diamond" size={size} color={isSelected ? '#07140F' : colors.gold} />;
      default:
        return <Ionicons name="grid" size={size} color={iconColor} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {LOBBY_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <Chip
              key={cat.id}
              label={cat.label}
              selected={isSelected}
              onPress={() => onSelectCategory(cat.id)}
              icon={getCategoryIcon(cat.icon, isSelected)}
              style={styles.chip}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  chip: {
    marginRight: 0,
  },
});
