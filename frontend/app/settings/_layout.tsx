import { Stack } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="profile"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="regions"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
