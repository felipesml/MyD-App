import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { RegionProvider } from '../src/contexts/RegionContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        // Small delay to ensure providers are ready
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error during app preparation:', e);
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
    <ThemeProvider>
      <RegionProvider>
        <NotificationProvider>
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
        </NotificationProvider>
      </RegionProvider>
    </ThemeProvider>
  );
}
