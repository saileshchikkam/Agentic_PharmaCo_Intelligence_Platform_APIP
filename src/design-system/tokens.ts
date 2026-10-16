/**
 * Material Design 3 Design Tokens for APIP
 * (Agentic Pharma Co-intelligence Platform)
 * 
 * Strict Google Material 3 implementation:
 * - Semantic color architecture (Light & Dark schemes)
 * - M3 Typography scale
 * - M3 Shape system
 * - M3 Elevation & Surface hierarchy
 * - M3 State layers & motion specs
 */

export interface ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  background: string;
  onBackground: string;

  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  surfaceDim: string;
  surfaceBright: string;

  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  outline: string;
  outlineVariant: string;

  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

// Light Scheme - Clinical & Calm Material 3 Palette
export const lightScheme: ColorScheme = {
  primary: '#0B57D0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D3E3FD',
  onPrimaryContainer: '#041E49',
  secondary: '#535F70',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8F0FE',
  onSecondaryContainer: '#1F1F1F',
  tertiary: '#575E71',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#DFE2F9',
  onTertiaryContainer: '#141B2C',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FFFFFF',
  onBackground: '#1F1F1F',
  surface: '#FFFFFF',
  onSurface: '#1F1F1F',
  surfaceVariant: '#F1F3F4',
  onSurfaceVariant: '#444746',
  surfaceDim: '#DADCE0',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8F9FA',
  surfaceContainer: '#F1F3F4',
  surfaceContainerHigh: '#ECEEF1',
  surfaceContainerHighest: '#E3E5E8',
  outline: '#747775',
  outlineVariant: '#C4C7C5',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#303030',
  inverseOnSurface: '#F2F2F2',
  inversePrimary: '#A8C7FA',
};

// Dark Scheme - Restful, Low-strain Clinical Dark Scheme
export const darkScheme: ColorScheme = {
  primary: '#A8C7FA',
  onPrimary: '#062E6F',
  primaryContainer: '#0842A0',
  onPrimaryContainer: '#D3E3FD',
  secondary: '#BCC7DB',
  onSecondary: '#263141',
  secondaryContainer: '#3C4758',
  onSecondaryContainer: '#D8E3F8',
  tertiary: '#BFC6DC',
  onTertiary: '#293042',
  tertiaryContainer: '#3F4659',
  onTertiaryContainer: '#DFE2F9',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#131314',
  onBackground: '#E3E3E3',
  surface: '#131314',
  onSurface: '#E3E3E3',
  surfaceVariant: '#303030',
  onSurfaceVariant: '#C4C7C5',
  surfaceDim: '#131314',
  surfaceBright: '#373739',
  surfaceContainerLowest: '#0E0E0F',
  surfaceContainerLow: '#1B1B1D',
  surfaceContainer: '#202022',
  surfaceContainerHigh: '#28282A',
  surfaceContainerHighest: '#333335',
  outline: '#8E918F',
  outlineVariant: '#444746',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E3E3E3',
  inverseOnSurface: '#303030',
  inversePrimary: '#0B57D0',
};

// Material 3 Typography Specs
export const typography = {
  fontFamily: "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  displayLarge: { size: '57px', lineHeight: '64px', tracking: '-0.25px', weight: 400 },
  displayMedium: { size: '45px', lineHeight: '52px', tracking: '0px', weight: 400 },
  displaySmall: { size: '36px', lineHeight: '44px', tracking: '0px', weight: 400 },

  headlineLarge: { size: '32px', lineHeight: '40px', tracking: '0px', weight: 400 },
  headlineMedium: { size: '28px', lineHeight: '36px', tracking: '0px', weight: 400 },
  headlineSmall: { size: '24px', lineHeight: '32px', tracking: '0px', weight: 400 },

  titleLarge: { size: '22px', lineHeight: '28px', tracking: '0px', weight: 400 },
  titleMedium: { size: '16px', lineHeight: '24px', tracking: '0.15px', weight: 500 },
  titleSmall: { size: '14px', lineHeight: '20px', tracking: '0.1px', weight: 500 },

  bodyLarge: { size: '16px', lineHeight: '24px', tracking: '0.5px', weight: 400 },
  bodyMedium: { size: '14px', lineHeight: '20px', tracking: '0.25px', weight: 400 },
  bodySmall: { size: '12px', lineHeight: '16px', tracking: '0.4px', weight: 400 },

  labelLarge: { size: '14px', lineHeight: '20px', tracking: '0.1px', weight: 500 },
  labelMedium: { size: '12px', lineHeight: '16px', tracking: '0.5px', weight: 500 },
  labelSmall: { size: '11px', lineHeight: '16px', tracking: '0.5px', weight: 500 },
};

// Material 3 Shape System
export const shape = {
  cornerNone: '0px',
  cornerExtraSmall: '4px',
  cornerSmall: '8px',
  cornerMedium: '12px',
  cornerLarge: '16px',
  cornerExtraLarge: '28px',
  cornerFull: '9999px',
};

// Material 3 Elevation System
export const elevation = {
  level0: 'none',
  level1: '0 1px 2px 0 rgba(0, 0, 0, 0.12), 0 1px 3px 1px rgba(0, 0, 0, 0.08)',
  level2: '0 1px 2px 0 rgba(0, 0, 0, 0.16), 0 2px 6px 2px rgba(0, 0, 0, 0.10)',
  level3: '0 1px 3px 0 rgba(0, 0, 0, 0.18), 0 4px 8px 3px rgba(0, 0, 0, 0.12)',
  level4: '0 2px 3px 0 rgba(0, 0, 0, 0.20), 0 6px 10px 4px rgba(0, 0, 0, 0.14)',
  level5: '0 4px 4px 0 rgba(0, 0, 0, 0.22), 0 8px 12px 6px rgba(0, 0, 0, 0.16)',
};

// Material 3 Motion Specs
export const motion = {
  durationShort1: '50ms',
  durationShort2: '100ms',
  durationShort3: '150ms',
  durationShort4: '200ms',
  durationMedium1: '250ms',
  durationMedium2: '300ms',
  durationMedium3: '350ms',
  durationMedium4: '400ms',
  durationLong1: '450ms',
  durationLong2: '500ms',
  easingStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easingStandardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  easingStandardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  easingEmphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  easingEmphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  easingEmphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
};

// Material 3 Spacing System (8dp Grid with 4dp Half-Steps)
export const spacing = {
  none: '0px',
  extraSmall: '4px',
  small: '8px',
  medium: '12px',
  large: '16px',
  extraLarge: '24px',
  xxl: '32px',
  xxxl: '48px',
  touchTargetMin: '48px',
};

// Material 3 State Layer Opacity Standards
export const stateLayers = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
};


// Neutral surfaces stay consistent while the user selects an interaction accent.
export type Accent = 'blue' | 'black' | 'green';

export function getColorScheme(accent: Accent, isDark: boolean): ColorScheme {
  const base = isDark ? darkScheme : lightScheme;
  if (accent === 'blue') return base;
  const primary = accent === 'black'
    ? isDark
      ? { primary: '#E3E3E3', onPrimary: '#1F1F1F', primaryContainer: '#444746', onPrimaryContainer: '#FFFFFF', inversePrimary: '#1F1F1F' }
      : { primary: '#1F1F1F', onPrimary: '#FFFFFF', primaryContainer: '#E3E3E3', onPrimaryContainer: '#1F1F1F', inversePrimary: '#E3E3E3' }
    : isDark
      ? { primary: '#7DD6A8', onPrimary: '#003822', primaryContainer: '#005234', onPrimaryContainer: '#A0F2C4', inversePrimary: '#146C43' }
      : { primary: '#146C43', onPrimary: '#FFFFFF', primaryContainer: '#C4EED0', onPrimaryContainer: '#00210D', inversePrimary: '#7DD6A8' };
  return { ...base, ...primary, secondary: primary.primary, onSecondary: primary.onPrimary, secondaryContainer: primary.primaryContainer, onSecondaryContainer: primary.onPrimaryContainer, tertiary: primary.primary, onTertiary: primary.onPrimary, tertiaryContainer: primary.primaryContainer, onTertiaryContainer: primary.onPrimaryContainer };
}
