/**
 * ZyroBet Color Palette
 * Premium Dark Green Gaming Aesthetic with Vibrant Accents
 */

export const colors = {
  // Backgrounds & Canvas
  bg: '#07140F', // Deep dark green canvas
  bgSecondary: '#0A1C15', // Subtle secondary background
  surface: '#0E2A1F', // Standard card & element container
  surfaceAlt: '#123626', // Elevated card / modal surface
  surfaceElevated: '#174330', // Floating / highlight surface
  surfaceHighlight: '#1A4D37', // Active / pressed surface state

  // Borders & Dividers
  border: '#1E5A3C', // Standard dark green border
  borderLight: '#2C7A53', // Active/focused element border
  borderGlow: 'rgba(46, 204, 113, 0.4)', // Accent green glow border

  // Primary Accent (Vibrant Green)
  primary: '#2ECC71', // Core brand green
  primaryDark: '#27AE60',
  primaryLight: '#58D68D',
  primaryMuted: 'rgba(46, 204, 113, 0.15)',
  primaryGlow: 'rgba(46, 204, 113, 0.35)',

  // Gold (Coins & Economy)
  gold: '#F5C542', // Virtual coins primary color
  goldDark: '#D4A017',
  goldLight: '#FCE38A',
  goldMuted: 'rgba(245, 197, 66, 0.15)',
  goldGlow: 'rgba(245, 197, 66, 0.4)',

  // Status & Feedback
  danger: '#FF5A5F', // Red alerts / live / danger
  dangerDark: '#D9383E',
  dangerMuted: 'rgba(255, 90, 95, 0.15)',
  dangerGlow: 'rgba(255, 90, 95, 0.35)',

  warning: '#FFA800',
  warningMuted: 'rgba(255, 168, 0, 0.15)',

  info: '#3498DB',
  infoMuted: 'rgba(52, 152, 219, 0.15)',

  // Typography
  text: '#F2FFF7', // Primary mint-white text
  textSecondary: '#C5E2D2', // Secondary readable text
  textMuted: '#8FB9A2', // Subtitles & metadata
  textSubtle: '#527E67', // Disabled / placeholder text
  textInverse: '#07140F', // Dark text on light badges

  // Overlays
  overlay: 'rgba(7, 20, 15, 0.85)',
  overlayLight: 'rgba(7, 20, 15, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
