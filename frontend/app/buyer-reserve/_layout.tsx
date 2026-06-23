import { Stack } from 'expo-router';

export default function BuyerReserveLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Detalle Comprador',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: true,
          title: 'Nuevo Comprador en Reserva',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: true,
          title: 'Editar Comprador',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
