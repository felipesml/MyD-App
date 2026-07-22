import { Stack } from 'expo-router';

export default function BuyerReserveLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Compradores en Reserva',
        }}
      />
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
    </Stack>
  );
}
