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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appointmentsAPI, clientsAPI, leadsAPI, propertiesAPI } from '../../src/api/client';
import { Client, Lead, Property } from '../../src/types';

export default function AddAppointmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appointmentType, setAppointmentType] = useState<'visita' | 'reunion' | 'llamada' | 'otro'>('visita');
  const [relatedEntity, setRelatedEntity] = useState<'client' | 'lead' | 'property' | null>(null);
  const [relatedId, setRelatedId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    // Set today's date as default
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setDate(dateStr);
    setTime('10:00');
  }, []);

  useEffect(() => {
    if (relatedEntity) {
      loadEntities();
    }
  }, [relatedEntity]);

  const loadEntities = async () => {
    setIsLoadingEntities(true);
    try {
      if (relatedEntity === 'client') {
        const data = await clientsAPI.getAll();
        setClients(data);
        if (data.length > 0) setRelatedId(data[0].id);
      } else if (relatedEntity === 'lead') {
        const data = await leadsAPI.getAll();
        setLeads(data);
        if (data.length > 0) setRelatedId(data[0].id);
      } else if (relatedEntity === 'property') {
        const data = await propertiesAPI.getAll();
        setProperties(data);
        if (data.length > 0) setRelatedId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading entities:', error);
    } finally {
      setIsLoadingEntities(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time) {
      Alert.alert('Error', 'Por favor completa título, fecha y hora');
      return;
    }

    setIsLoading(true);
    try {
      const dateTime = `${date}T${time}:00.000Z`;

      await appointmentsAPI.create({
        title: title.trim(),
        description: description.trim() || undefined,
        appointment_type: appointmentType,
        related_entity: relatedEntity || undefined,
        related_id: relatedEntity && relatedId ? relatedId : undefined,
        date_time: dateTime,
        duration_minutes: parseInt(durationMinutes),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Éxito', 'Cita creada correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', error.message || 'Error al crear la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEntitySelector = () => {
    if (!relatedEntity) return null;

    if (isLoadingEntities) {
      return <ActivityIndicator size="small" color="#3b82f6" />;
    }

    let entities: { id: string; name: string }[] = [];
    if (relatedEntity === 'client') {
      entities = clients.map((c) => ({ id: c.id, name: c.name }));
    } else if (relatedEntity === 'lead') {
      entities = leads.map((l) => ({ id: l.id, name: l.name }));
    } else if (relatedEntity === 'property') {
      entities = properties.map((p) => ({ id: p.id, name: p.title }));
    }

    if (entities.length === 0) {
      return (
        <Text style={styles.emptyEntityText}>
          No hay {relatedEntity === 'client' ? 'clientes' : relatedEntity === 'lead' ? 'leads' : 'propiedades'}{' '}
          disponibles
        </Text>
      );
    }

    return (
      <ScrollView horizontal style={styles.entitySelector}>
        {entities.map((entity) => (
          <TouchableOpacity
            key={entity.id}
            style={[styles.entityChip, relatedId === entity.id && styles.entityChipActive]}
            onPress={() => setRelatedId(entity.id)}
          >
            <Text style={[styles.entityChipText, relatedId === entity.id && styles.entityChipTextActive]}>
              {entity.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Título <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Reunión con cliente"
              value={title}
              onChangeText={setTitle}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalles de la cita..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Cita</Text>
            <View style={styles.typeGrid}>
              {(['visita', 'reunion', 'llamada', 'otro'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, appointmentType === type && styles.typeButtonActive]}
                  onPress={() => setAppointmentType(type)}
                >
                  <Ionicons
                    name={
                      type === 'visita'
                        ? 'home'
                        : type === 'reunion'
                        ? 'people'
                        : type === 'llamada'
                        ? 'call'
                        : 'calendar'
                    }
                    size={24}
                    color={appointmentType === type ? '#fff' : '#6b7280'}
                  />
                  <Text style={[styles.typeButtonText, appointmentType === type && styles.typeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relacionar con (opcional)</Text>
            <View style={styles.relatedTypeGroup}>
              <TouchableOpacity
                style={[styles.relatedTypeButton, relatedEntity === null && styles.relatedTypeButtonActive]}
                onPress={() => {
                  setRelatedEntity(null);
                  setRelatedId('');
                }}
              >
                <Text
                  style={[
                    styles.relatedTypeText,
                    relatedEntity === null && styles.relatedTypeTextActive,
                  ]}
                >
                  Ninguno
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.relatedTypeButton, relatedEntity === 'client' && styles.relatedTypeButtonActive]}
                onPress={() => setRelatedEntity('client')}
              >
                <Text
                  style={[
                    styles.relatedTypeText,
                    relatedEntity === 'client' && styles.relatedTypeTextActive,
                  ]}
                >
                  Cliente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.relatedTypeButton, relatedEntity === 'lead' && styles.relatedTypeButtonActive]}
                onPress={() => setRelatedEntity('lead')}
              >
                <Text
                  style={[
                    styles.relatedTypeText,
                    relatedEntity === 'lead' && styles.relatedTypeTextActive,
                  ]}
                >
                  Lead
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.relatedTypeButton, relatedEntity === 'property' && styles.relatedTypeButtonActive]}
                onPress={() => setRelatedEntity('property')}
              >
                <Text
                  style={[
                    styles.relatedTypeText,
                    relatedEntity === 'property' && styles.relatedTypeTextActive,
                  ]}
                >
                  Propiedad
                </Text>
              </TouchableOpacity>
            </View>
            {renderEntitySelector()}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.label}>
                Fecha <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2025-01-15"
                value={date}
                onChangeText={setDate}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                Hora <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="10:00"
                value={time}
                onChangeText={setTime}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duración (minutos)</Text>
            <View style={styles.durationGroup}>
              {['30', '60', '90', '120'].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[styles.durationButton, durationMinutes === duration && styles.durationButtonActive]}
                  onPress={() => setDurationMinutes(duration)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      durationMinutes === duration && styles.durationButtonTextActive,
                    ]}
                  >
                    {duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notas adicionales..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>{isLoading ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  relatedTypeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  relatedTypeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  relatedTypeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  relatedTypeTextActive: {
    color: '#fff',
  },
  entitySelector: {
    flexDirection: 'row',
    marginTop: 8,
  },
  entityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  entityChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  entityChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  entityChipTextActive: {
    color: '#fff',
  },
  emptyEntityText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  durationGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
});
