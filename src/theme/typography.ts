import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  bodyBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textMuted,
  } as TextStyle,
  captionBold: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  } as TextStyle,
  coin: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.2,
  } as TextStyle,
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } as TextStyle,
  fonts: {
    heading: undefined,
    body: undefined,
    mono: undefined,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
