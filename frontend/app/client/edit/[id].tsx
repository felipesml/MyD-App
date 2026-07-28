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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientsAPI } from '../../../src/api/client';
import WhatsAppButton from '../../../src/components/WhatsAppButton';

export default function EditClientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    if (!id) return;
    try {
      const client = await clientsAPI.getById(id);
      setName(client.name);
      setEmail(client.email || '');
      setPhone(client.phone);
      setAddress(client.address || '');
      setNationality(client.nationality || '');
      setNotes(client.notes || '');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el cliente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'El nombre y teléfono son obligatorios');
      return;
    }
    setIsLoading(true);
    try {
      await clientsAPI.update(id!, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        nationality: nationality.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Éxito', 'Cliente actualizado', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Nombre completo" value={name} onChangeText={setName} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Teléfono <Text style={styles.required}>*</Text></Text>
              <WhatsAppButton phone={phone} size={20} disabled={!phone.trim()} />
            </View>
            <TextInput style={styles.input} placeholder="+56912345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nacionalidad</Text>
            <TextInput style={styles.input} value={nationality} onChangeText={setNationality} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput style={styles.input} placeholder="Dirección completa" value={address} onChangeText={setAddress} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Notas adicionales" value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" editable={!isLoading} />
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
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  required: { color: '#ef4444' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#111827' },
  textArea: { height: 100, paddingTop: 12 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  submitButton: { backgroundColor: '#3b82f6' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDisabled: { backgroundColor: '#93c5fd' },
});
