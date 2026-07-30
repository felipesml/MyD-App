import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { appointmentsAPI } from '../../src/api/client';
import { Appointment } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import { usePreferences } from '../../src/contexts/PreferencesContext';

const TYPE_ICONS: Record<string, string> = {
  visita: 'home',
  reunion: 'people',
  llamada: 'call',
  otro: 'calendar',
};

const TYPE_COLORS: Record<string, string> = {
  visita: '#10b981',
  reunion: '#3b82f6',
  llamada: '#f59e0b',
  otro: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  visita: 'Visita',
  reunion: 'Reunión',
  llamada: 'Llamada',
  otro: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_informado: 'No Informado',
};

const STATUS_COLORS: Record<string, string> = {
  programada: '#10b981',
  completada: '#3b82f6',
  cancelada: '#ef4444',
  no_informado: '#f59e0b',
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { formatTime } = usePreferences();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAppointment();
    }, [id])
  );

  const loadAppointment = async () => {
    if (!id) return;
    try {
      const data = await appointmentsAPI.getById(id);
      setAppointment(data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'No se pudo cargar la cita', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await appointmentsAPI.updateStatus(id!, status);
      loadAppointment();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado');
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar Cita', `¿Eliminar "${appointment?.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await appointmentsAPI.delete(id!);
            Alert.alert('Éxito', 'Cita eliminada', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al eliminar');
          }
        },
      },
    ]);
  };

  const styles = createStyles(colors, insets);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Cita no encontrada</Text>
      </View>
    );
  }

  const date = parseISO(appointment.date_time);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.headerCard}>
          <View style={[styles.typeIcon, { backgroundColor: TYPE_COLORS[appointment.appointment_type] + '20' }]}>
            <Ionicons
              name={TYPE_ICONS[appointment.appointment_type] as any}
              size={32}
              color={TYPE_COLORS[appointment.appointment_type]}
            />
          </View>
          <Text style={styles.title}>{appointment.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[appointment.appointment_type] + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[appointment.appointment_type] }]}>
              {TYPE_LABELS[appointment.appointment_type]}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <InfoRow
            icon="calendar-outline"
            text={format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            colors={colors}
          />
          <InfoRow icon="time-outline" text={formatTime(date)} colors={colors} />
          <InfoRow icon="hourglass-outline" text={`${appointment.duration_minutes} minutos`} colors={colors} />
          {appointment.related_name ? (
            <InfoRow icon="person-outline" text={appointment.related_name} colors={colors} />
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}>
            <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[appointment.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[appointment.status] }]}>
                {STATUS_LABELS[appointment.status]}
              </Text>
            </View>
          </View>
        </View>

        {appointment.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descText}>{appointment.description}</Text>
          </View>
        ) : null}

        {appointment.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.descText}>{appointment.notes}</Text>
          </View>
        ) : null}

        {appointment.status === 'programada' && (
          <View style={styles.statusActions}>
            <TouchableOpacity style={styles.completeBtn} onPress={() => updateStatus('completada')}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>Completar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => updateStatus('cancelada')}>
              <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.cancelBtnText}>Cancelar cita</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/appointment/edit/${id}`)}>
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
      <Text style={{ fontSize: 15, color: colors.text, flex: 1, textTransform: 'capitalize' }}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: colors.textMuted },
    content: { padding: 16 },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
    },
    typeIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
    typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    typeBadgeText: { fontWeight: '600', fontSize: 13 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
    descText: { fontSize: 15, color: colors.text, lineHeight: 22 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontWeight: '600', fontSize: 13 },
    statusActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    completeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    completeBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    cancelBtn: {
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
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
    buttonsContainer: { flexDirection: 'row', gap: 12 },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8b5cf6',
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
