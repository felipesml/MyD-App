import { Platform } from 'react-native';

// System fonts that work on both iOS and Android without loading
// iOS: San Francisco (SF Pro) - Apple's system font
// Android: Roboto - Google's system font
export const fonts = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

// Font weights to use with system fonts
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

// Pre-configured text styles using system fonts
export const typography = {
  // Headings
  h1: {
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  h2: {
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fonts.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  h4: {
    fontFamily: fonts.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 18,
    lineHeight: 26,
  },
  // Body text
  bodyLarge: {
    fontFamily: fonts.regular,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.regular,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  // Labels
  labelLarge: {
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  // Buttons
  button: {
    fontFamily: fonts.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: fonts.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  // Caption
  caption: {
    fontFamily: fonts.regular,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    lineHeight: 16,
  },
};

// No font loading needed - using system fonts
export const useMontserratFonts = () => {
  // Return immediately loaded since we use system fonts
  return { fontsLoaded: true, fontError: null };
};
