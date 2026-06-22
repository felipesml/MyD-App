import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        // Pre-warm the icon assets
        const iconAssets = [
          require('../assets/icon.png'),
          require('../assets/adaptive-icon.png'),
          require('../assets/favicon.png'),
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
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="client" />
        <Stack.Screen name="lead" />
        <Stack.Screen name="property" />
        <Stack.Screen name="appointment" />
      </Stack>
    </AuthProvider>
  );
}