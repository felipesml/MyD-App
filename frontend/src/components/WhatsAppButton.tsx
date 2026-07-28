import React from 'react';
import { TouchableOpacity, Linking, Alert, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WhatsAppButtonProps {
  phone: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function WhatsAppButton({
  phone,
  size = 24,
  color = '#25D366',
  disabled = false,
  style,
}: WhatsAppButtonProps) {
  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Chilean numbers: ensure country code 56
    if (cleaned.startsWith('56')) {
      return cleaned;
    } else if (cleaned.length === 9) {
      // Chilean mobile without country code
      return '56' + cleaned;
    }
    return cleaned;
  };

  const handlePress = async () => {
    if (!phone || phone.trim() === '') {
      Alert.alert('Error', 'Número de teléfono no disponible');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    // wa.me works whether or not the app is installed: it opens the WhatsApp
    // app when available and falls back to the browser otherwise.
    const webUrl = `https://wa.me/${formattedPhone}`;

    try {
      if (Platform.OS !== 'web') {
        // Try the native scheme first for a smoother experience
        const nativeUrl = `whatsapp://send?phone=${formattedPhone}`;
        const canOpenNative = await Linking.canOpenURL(nativeUrl);
        if (canOpenNative) {
          await Linking.openURL(nativeUrl);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (err) {
      console.error('Error opening WhatsApp:', err);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  if (disabled || !phone || phone.trim() === '') {
    return (
      <TouchableOpacity style={[styles.button, style]} disabled>
        <Ionicons name="logo-whatsapp" size={size} color="#9ca3af" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <Ionicons name="logo-whatsapp" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
