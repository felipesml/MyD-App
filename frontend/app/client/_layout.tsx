import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Detalle del Cliente',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: true,
          title: 'Agregar Cliente',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: true,
          title: 'Editar Cliente',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
