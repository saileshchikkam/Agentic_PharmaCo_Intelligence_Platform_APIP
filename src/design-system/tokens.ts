/**
 * Material Design 3 Design Tokens for APIP
 * (Agentic Pharma Intelligence Platform)
 * 
 * Strict Google Material 3 implementation:
 * - HCT semantic color architecture (Light & Dark schemes)
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
  primary: '#006A6A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#6FF7F6',
  onPrimaryContainer: '#002020',

  secondary: '#4A6363',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCE8E7',
  onSecondaryContainer: '#051F20',

  tertiary: '#4B607C',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#D3E4FF',
  onTertiaryContainer: '#041C35',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  background: '#FAFDFD',
  onBackground: '#191C1C',

  surface: '#FAFDFD',
  onSurface: '#191C1C',
  surfaceVariant: '#DAE5E4',
  onSurfaceVariant: '#3F4948',

  surfaceDim: '#D7DBDB',
  surfaceBright: '#FAFDFD',

  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F1F5F4',
  surfaceContainer: '#EBEFEE',
  surfaceContainerHigh: '#E5EAE9',
  surfaceContainerHighest: '#DFE4E3',

  outline: '#6F7979',
  outlineVariant: '#BEC8C8',

  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2D3131',
  inverseOnSurface: '#EFF1F1',
  inversePrimary: '#4DDADA',
};

// Dark Scheme - Restful, Low-strain Clinical Dark Scheme
export const darkScheme: ColorScheme = {
  primary: '#4DDADA',
  onPrimary: '#003737',
  primaryContainer: '#004F4F',
  onPrimaryContainer: '#6FF7F6',

  secondary: '#B0CCCC',
  onSecondary: '#1B3535',
  secondaryContainer: '#324B4B',
  onSecondaryContainer: '#CCE8E7',

  tertiary: '#B3C8E8',
  onTertiary: '#1C324C',
  tertiaryContainer: '#334963',
  onTertiaryContainer: '#D3E4FF',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  background: '#0E1414',
  onBackground: '#DFE4E3',

  surface: '#0E1414',
  onSurface: '#DFE4E3',
  surfaceVariant: '#3F4948',
  onSurfaceVariant: '#BEC8C8',

  surfaceDim: '#0E1414',
  surfaceBright: '#343A3A',

  surfaceContainerLowest: '#090F0F',
  surfaceContainerLow: '#161D1D',
  surfaceContainer: '#1B2121',
  surfaceContainerHigh: '#252B2B',
  surfaceContainerHighest: '#303636',

  outline: '#899392',
  outlineVariant: '#3F4948',

  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#DFE4E3',
  inverseOnSurface: '#2D3131',
  inversePrimary: '#006A6A',
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

