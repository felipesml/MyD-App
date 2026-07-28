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
import { leadsAPI } from '../../src/api/client';
import { Lead } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import WhatsAppButton from '../../src/components/WhatsAppButton';

const STATUS_COLORS: Record<string, string> = {
  nuevo: '#3b82f6',
  contactado: '#f59e0b',
  visita_programada: '#8b5cf6',
  negociacion: '#06b6d4',
  cerrado: '#10b981',
  perdido: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  visita_programada: 'Visita Programada',
  negociacion: 'Negociación',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
};

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referido: 'Referido',
  llamada: 'Llamada',
  redes_sociales: 'Redes Sociales',
  otro: 'Otro',
};

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLead();
    }, [id])
  );

  const loadLead = async () => {
    if (!id) return;
    try {
      const data = await leadsAPI.getById(id);
      setLead(data);
    } catch (error) {
      console.error('Error loading lead:', error);
      Alert.alert('Error', 'No se pudo cargar el lead', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar Lead', `¿Eliminar a ${lead?.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await leadsAPI.delete(id!);
            Alert.alert('Éxito', 'Lead eliminado', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al eliminar');
          }
        },
      },
    ]);
  };

  const formatBudget = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const styles = createStyles(colors, insets);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Lead no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{lead.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{lead.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[lead.status] + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[lead.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[lead.status] }]}>
              {STATUS_LABELS[lead.status]}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="call" size={22} color="#3b82f6" />
            </View>
            <Text style={styles.actionLabel}>Llamar</Text>
          </TouchableOpacity>
          <WhatsAppButton phone={lead.phone} size={22} style={styles.actionBtn} />
          {lead.email && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${lead.email}`)}>
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="mail" size={22} color="#f59e0b" />
              </View>
              <Text style={styles.actionLabel}>Email</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Información</Text>
          <InfoRow icon="call-outline" text={lead.phone} colors={colors} />
          {lead.email && <InfoRow icon="mail-outline" text={lead.email} colors={colors} />}
          <InfoRow
            icon={lead.interest_type === 'compra' ? 'cart-outline' : 'key-outline'}
            text={`Interés: ${lead.interest_type === 'compra' ? 'Compra' : 'Arriendo'}`}
            colors={colors}
          />
          {lead.budget ? (
            <InfoRow icon="cash-outline" text={`Presupuesto: ${formatBudget(lead.budget)}`} colors={colors} />
          ) : null}
          <InfoRow icon="git-network-outline" text={`Fuente: ${SOURCE_LABELS[lead.source] || lead.source}`} colors={colors} />
        </View>

        {lead.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.notesText}>{lead.notes}</Text>
          </View>
        ) : null}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/lead/edit/${id}`)}>
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

function InfoRow({ icon, text, colors }: { icon: any; text: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: colors.textMuted },
    content: { padding: 16 },
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
      backgroundColor: '#f59e0b',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
    name: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontWeight: '600', fontSize: 13 },
    actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
    actionBtn: { alignItems: 'center' },
    actionIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    actionLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
    notesText: { fontSize: 15, color: colors.text, lineHeight: 22 },
    buttonsContainer: { flexDirection: 'row', gap: 12 },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f59e0b',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    editButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
    deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  });
