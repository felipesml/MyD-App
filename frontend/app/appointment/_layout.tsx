import { Stack } from 'expo-router';

export default function AppointmentLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Detalle de Cita',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: true,
          title: 'Nueva Cita',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: true,
          title: 'Editar Cita',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}