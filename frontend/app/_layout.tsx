import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { RegionProvider } from '../src/contexts/RegionContext';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { useMontserratFonts } from '../src/theme/fonts';
import { View, ActivityIndicator } from 'react-native';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const { fontsLoaded, fontError } = useMontserratFonts();

  React.useEffect(() => {
    async function prepare() {
      try {
        // Pre-warm the icon assets
        const iconAssets = [
          require('../assets/images/icon.png'),
          require('../assets/images/adaptive-icon.png'),
          require('../assets/images/favicon.png'),
        ];
        await Asset.loadAsync(iconAssets);
      } catch (e) {
        console.warn('Error loading assets:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  React.useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  return (
    <ThemeProvider>
      <RegionProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="client" />
            <Stack.Screen name="lead" />
            <Stack.Screen name="property" />
            <Stack.Screen name="appointment" />
            <Stack.Screen name="buyer-reserve" />
            <Stack.Screen name="settings" />
          </Stack>
        </AuthProvider>
      </RegionProvider>
    </ThemeProvider>
  );
}