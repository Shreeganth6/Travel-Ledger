// ─── COLORS ──────────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary Gradient — Indigo / Violet
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',

  // Secondary — Emerald / Cyan
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',

  // Accent
  accent: '#F59E0B',
  accentPink: '#EC4899',
  accentPurple: '#A855F7',
  accentCyan: '#06B6D4',

  // ── Dark Background System ──────────────────────────────────────────────────
  background: '#0A0F1E',       // Almost-black navy
  backgroundCard: '#111827',   // Slightly lighter for layered depth
  backgroundElevated: '#1C2340', // Elevated surfaces

  // ── Glassmorphism Surfaces ──────────────────────────────────────────────────
  glass: 'rgba(255, 255, 255, 0.07)',
  glassMedium: 'rgba(255, 255, 255, 0.12)',
  glassStrong: 'rgba(255, 255, 255, 0.18)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.2)',

  // ── Text Colors ─────────────────────────────────────────────────────────────
  textPrimary: '#F1F5F9',       // Near-white
  textSecondary: '#94A3B8',     // Muted slate
  textTertiary: '#475569',      // Dimmed
  textLight: '#FFFFFF',
  textMuted: '#64748B',

  // Legacy card color (for compatibility)
  card: 'rgba(255, 255, 255, 0.07)',
  cardGlass: 'rgba(255, 255, 255, 0.1)',
  white: '#FFFFFF',
  black: '#000000',

  // ── Borders & Dividers ──────────────────────────────────────────────────────
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  divider: 'rgba(255, 255, 255, 0.08)',

  // ── Status Colors ───────────────────────────────────────────────────────────
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.15)',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',

  // ── Overlays ────────────────────────────────────────────────────────────────
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // ── Gradient Definitions ────────────────────────────────────────────────────
  gradientPrimary: ['#6366F1', '#8B5CF6', '#A855F7'],      // Indigo → Purple
  gradientSecondary: ['#10B981', '#14B8A6', '#06B6D4'],    // Green → Cyan
  gradientWarm: ['#F59E0B', '#EF4444', '#EC4899'],         // Amber → Pink
  gradientCool: ['#3B82F6', '#6366F1', '#8B5CF6'],         // Blue → Purple
  gradientSuccess: ['#10B981', '#34D399'],
  gradientDanger: ['#EF4444', '#F87171'],
  gradientDark: ['#0A0F1E', '#1A1040'],                    // Dark BG gradient
  gradientCard: ['rgba(99,102,241,0.2)', 'rgba(168,85,247,0.1)'], // Subtle glass gradient
};

export const SHADOWS = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  small: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 0 },
  medium: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 0 },
  large: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 0 },
  colored: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 0 },
  glow: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 0 },
};

// ─── SIZES ───────────────────────────────────────────────────────────────────
export const SIZES = {
  // Spacing
  padding: 16,
  paddingSmall: 12,
  paddingLarge: 24,
  paddingXL: 32,
  margin: 16,

  // Border Radius
  radius: 16,
  radiusSmall: 10,
  radiusLarge: 24,
  radiusXL: 32,
  radiusFull: 9999,

  // Typography
  h1: 32,
  h2: 26,
  h3: 22,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,
  small: 13,

  // Component Sizes
  buttonHeight: 56,
  buttonHeightSmall: 44,
  inputHeight: 56,
  iconSmall: 20,
  iconMedium: 24,
  iconLarge: 32,
  iconXL: 48,
};

// ─── FONTS ───────────────────────────────────────────────────────────────────
export const FONTS = {
  // Heading family (Poppins)
  heading: 'Poppins_700Bold',
  headingMedium: 'Poppins_600SemiBold',
  headingLight: 'Poppins_500Medium',

  // Body family (Inter)
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',

  // Aliases used by older code
  extraBold: 'Poppins_800ExtraBold',

  // Font Weights (for inline use)
  weight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ─── ANIMATIONS ──────────────────────────────────────────────────────────────
export const ANIMATIONS = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// ─── SPACING SCALE ───────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── GLASS HELPERS ───────────────────────────────────────────────────────────
export const GLASS = {
  // Standard glass card style
  card: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radiusLarge,
  },
  // More prominent glass
  cardStrong: {
    backgroundColor: COLORS.glassMedium,
    borderWidth: 1,
    borderColor: COLORS.glassBorderStrong,
    borderRadius: SIZES.radiusLarge,
  },
  // Input field glass
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: SIZES.radius,
  },
};
