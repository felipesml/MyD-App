import { Stack } from 'expo-router';

export default function LeadLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Detalle de Lead',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: true,
          title: 'Agregar Lead',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: true,
          title: 'Editar Lead',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}