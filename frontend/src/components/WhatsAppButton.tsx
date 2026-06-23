import React from 'react';
import { TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WhatsAppButtonProps {
  phone: string;
  size?: number;
  color?: string;
  disabled?: boolean;
}

export default function WhatsAppButton({ phone, size = 24, color = '#25D366', disabled = false }: WhatsAppButtonProps) {
  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with +56 (Chile), make sure it's in international format
    if (cleaned.startsWith('56')) {
      return cleaned;
    } else if (cleaned.startsWith('9') && cleaned.length === 9) {
      // Chilean mobile number without country code
      return '56' + cleaned;
    } else if (cleaned.length === 9) {
      // Assume Chilean mobile
      return '56' + cleaned;
    }
    
    return cleaned;
  };

  const handlePress = () => {
    if (!phone || phone.trim() === '') {
      Alert.alert('Error', 'Número de teléfono no disponible');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const whatsappUrl = `https://wa.me/${formattedPhone}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo');
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
      });
  };

  if (disabled || !phone || phone.trim() === '') {
    return (
      <TouchableOpacity style={styles.disabledButton} disabled>
        <Ionicons name="logo-whatsapp" size={size} color="#9ca3af" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Ionicons name="logo-whatsapp" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
  disabledButton: {
    padding: 4,
    opacity: 0.5,
  },
});
