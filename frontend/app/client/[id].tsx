import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientsAPI, propertiesAPI } from '../../src/api/client';
import { Client, Property } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import WhatsAppButton from '../../src/components/WhatsAppButton';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadClientData();
    }, [id])
  );

  const loadClientData = async () => {
    if (!id) return;
    try {
      const clientData = await clientsAPI.getById(id);
      setClient(clientData);
      
      // Load client's properties
      const allProperties = await propertiesAPI.getAll();
      const clientProperties = allProperties.filter(p => p.client_id === id);
      setProperties(clientProperties);
    } catch (error: any) {
      console.error('Error loading client:', error);
      Alert.alert('Error', 'No se pudo cargar el cliente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Estás seguro de que deseas eliminar a ${client?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => performDelete(false),
        },
      ]
    );
  };

  const performDelete = async (cascade: boolean) => {
    try {
      await clientsAPI.delete(id!, cascade);
      Alert.alert('Éxito', 'Cliente eliminado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      // 409 => client has associated properties, offer cascade delete
      if (error?.response?.status === 409) {
        const detail = error?.response?.data?.detail || 'El cliente tiene propiedades asociadas';
        Alert.alert(
          'Cliente con propiedades',
          `${detail}. ¿Deseas eliminar el cliente junto con sus propiedades?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar todo',
              style: 'destructive',
              onPress: () => performDelete(true),
            },
          ]
        );
      } else {
        Alert.alert('Error', error?.response?.data?.detail || error.message || 'Error al eliminar el cliente');
      }
    }
  };

  const handleCall = () => {
    if (client?.phone) {
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const handleEmail = () => {
    if (client?.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const styles = createStyles(colors, insets);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Cliente no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.nationality && (
            <Text style={styles.nationality}>{client.nationality}</Text>
          )}
        </View>

        {/* Contact Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="call" size={22} color="#3b82f6" />
            </View>
            <Text style={styles.actionLabel}>Llamar</Text>
          </TouchableOpacity>

          <WhatsAppButton phone={client.phone} size={22} style={styles.whatsappBtn} />

          {client.email && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="mail" size={22} color="#f59e0b" />
              </View>
              <Text style={styles.actionLabel}>Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>{client.phone}</Text>
          </View>

          {client.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <Text style={styles.infoText}>{client.email}</Text>
            </View>
          )}

          {client.nationality && (
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
              <Text style={styles.infoText}>{client.nationality}</Text>
            </View>
          )}
        </View>

        {/* Properties */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Propiedades ({properties.length})</Text>
            <TouchableOpacity onPress={() => router.push(`/property/add?clientId=${id}`)}>
              <Ionicons name="add-circle" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>

          {properties.length === 0 ? (
            <Text style={styles.emptyText}>Sin propiedades registradas</Text>
          ) : (
            properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyItem}
                onPress={() => router.push(`/property/${property.id}`)}
              >
                <View style={styles.propertyIcon}>
                  <Ionicons name="home" size={18} color="#10b981" />
                </View>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <Text style={styles.propertyAddress} numberOfLines={1}>
                    {property.address}, {property.city}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/client/edit/${id}`)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.textMuted,
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: '#3b82f6',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#3b82f6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#fff',
    },
    clientName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    nationality: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      marginBottom: 16,
    },
    actionBtn: {
      alignItems: 'center',
    },
    actionIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    actionLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
    },
    whatsappBtn: {
      alignItems: 'center',
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: 12,
    },
    infoText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
    },
    propertyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    propertyIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#10b98120',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    propertyInfo: {
      flex: 1,
    },
    propertyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    propertyAddress: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3b82f6',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    deleteButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ef4444',
      gap: 8,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ef4444',
    },
  });
