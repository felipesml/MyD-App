import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appointmentsAPI } from '../../../src/api/client';
import DateTimeField from '../../../src/components/DateTimeField';

export default function EditAppointmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appointmentType, setAppointmentType] = useState<'visita' | 'reunion' | 'llamada' | 'otro'>('visita');
  const [dateTime, setDateTime] = useState<Date>(new Date());
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [notes, setNotes] = useState('');
  const [relatedEntity, setRelatedEntity] = useState<'client' | 'lead' | 'property' | undefined>(undefined);
  const [relatedId, setRelatedId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    if (!id) return;
    try {
      const appt = await appointmentsAPI.getById(id);
      setTitle(appt.title);
      setDescription(appt.description || '');
      setAppointmentType(appt.appointment_type);
      setDateTime(new Date(appt.date_time));
      setDurationMinutes(String(appt.duration_minutes));
      setNotes(appt.notes || '');
      setRelatedEntity(appt.related_entity);
      setRelatedId(appt.related_id);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la cita', [{ text: 'OK', onPress: () => router.back() }]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor completa el título');
      return;
    }
    setIsLoading(true);
    try {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateTimeStr = `${dateTime.getFullYear()}-${pad(dateTime.getMonth() + 1)}-${pad(dateTime.getDate())}T${pad(dateTime.getHours())}:${pad(dateTime.getMinutes())}:00`;
      await appointmentsAPI.update(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        appointment_type: appointmentType,
        related_entity: relatedEntity,
        related_id: relatedId,
        date_time: dateTimeStr,
        duration_minutes: parseInt(durationMinutes),
        notes: notes.trim() || undefined,
      });
      Alert.alert('Éxito', 'Cita actualizada', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Reunión con cliente" value={title} onChangeText={setTitle} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Detalles..." value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Cita</Text>
            <View style={styles.typeGrid}>
              {(['visita', 'reunion', 'llamada', 'otro'] as const).map((type) => (
                <TouchableOpacity key={type} style={[styles.typeButton, appointmentType === type && styles.typeButtonActive]} onPress={() => setAppointmentType(type)}>
                  <Ionicons name={type === 'visita' ? 'home' : type === 'reunion' ? 'people' : type === 'llamada' ? 'call' : 'calendar'} size={22} color={appointmentType === type ? '#fff' : '#6b7280'} />
                  <Text style={[styles.typeButtonText, appointmentType === type && styles.typeButtonTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha y Hora <Text style={styles.required}>*</Text></Text>
            <DateTimeField value={dateTime} onChange={setDateTime} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duración (minutos)</Text>
            <View style={styles.durationGroup}>
              {['30', '60', '90', '120'].map((d) => (
                <TouchableOpacity key={d} style={[styles.durationButton, durationMinutes === d && styles.durationButtonActive]} onPress={() => setDurationMinutes(d)}>
                  <Text style={[styles.durationButtonText, durationMinutes === d && styles.durationButtonTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Notas adicionales..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" editable={!isLoading} />
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
              <Text style={styles.submitButtonText}>{isLoading ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  required: { color: '#ef4444' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#111827' },
  textArea: { height: 80, paddingTop: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeButton: { flex: 1, minWidth: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, gap: 8 },
  typeButtonActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  typeButtonTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  durationGroup: { flexDirection: 'row', gap: 12 },
  durationButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  durationButtonActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  durationButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  durationButtonTextActive: { color: '#fff' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  submitButton: { backgroundColor: '#8b5cf6' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDisabled: { opacity: 0.6 },
});
