import { Stack } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Configuración',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Editar Perfil',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="regions"
        options={{
          title: 'Filtro de Regiones',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: 'Apariencia',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
