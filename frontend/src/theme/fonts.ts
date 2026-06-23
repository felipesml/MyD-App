import { useFonts } from 'expo-font';

export const useMontserratFonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('../../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
  });

  return { fontsLoaded, fontError };
};

// Font family names for use in styles
export const fonts = {
  regular: 'Montserrat-Regular',
  medium: 'Montserrat-Medium',
  semiBold: 'Montserrat-SemiBold',
  bold: 'Montserrat-Bold',
};

// Pre-configured text styles
export const typography = {
  // Headings
  h1: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  h2: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  h4: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    lineHeight: 26,
  },
  // Body text
  bodyLarge: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  // Labels
  labelLarge: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  // Buttons
  button: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  // Caption
  caption: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    lineHeight: 16,
  },
};
