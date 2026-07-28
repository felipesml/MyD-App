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
import { leadsAPI } from '../../../src/api/client';
import WhatsAppButton from '../../../src/components/WhatsAppButton';

export default function EditLeadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interestType, setInterestType] = useState<'compra' | 'arriendo'>('compra');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('nuevo');
  const [source, setSource] = useState('otro');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadLead();
  }, [id]);

  const loadLead = async () => {
    if (!id) return;
    try {
      const lead = await leadsAPI.getById(id);
      setName(lead.name);
      setEmail(lead.email || '');
      setPhone(lead.phone);
      setInterestType(lead.interest_type);
      setBudget(lead.budget ? String(lead.budget) : '');
      setStatus(lead.status);
      setSource(lead.source);
      setNotes(lead.notes || '');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el lead', [{ text: 'OK', onPress: () => router.back() }]);
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
      await leadsAPI.update(id!, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        interest_type: interestType,
        budget: budget ? parseFloat(budget) : undefined,
        status: status as any,
        source: source as any,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Éxito', 'Lead actualizado', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
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
            <Text style={styles.label}>Tipo de Interés</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={[styles.radioButton, interestType === 'compra' && styles.radioButtonActive]} onPress={() => setInterestType('compra')}>
                <Text style={[styles.radioText, interestType === 'compra' && styles.radioTextActive]}>Compra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.radioButton, interestType === 'arriendo' && styles.radioButtonActive]} onPress={() => setInterestType('arriendo')}>
                <Text style={[styles.radioText, interestType === 'arriendo' && styles.radioTextActive]}>Arriendo</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Presupuesto (CLP)</Text>
            <TextInput style={styles.input} placeholder="50000000" value={budget} onChangeText={setBudget} keyboardType="numeric" editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estado</Text>
            <ScrollView horizontal style={styles.statusSelector} showsHorizontalScrollIndicator={false}>
              {[
                { value: 'nuevo', label: 'Nuevo' },
                { value: 'contactado', label: 'Contactado' },
                { value: 'visita_programada', label: 'Visita Programada' },
                { value: 'negociacion', label: 'Negociación' },
                { value: 'cerrado', label: 'Cerrado' },
                { value: 'perdido', label: 'Perdido' },
              ].map((item) => (
                <TouchableOpacity key={item.value} style={[styles.chip, status === item.value && styles.chipActive]} onPress={() => setStatus(item.value)}>
                  <Text style={[styles.chipText, status === item.value && styles.chipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fuente</Text>
            <ScrollView horizontal style={styles.statusSelector} showsHorizontalScrollIndicator={false}>
              {[
                { value: 'web', label: 'Web' },
                { value: 'referido', label: 'Referido' },
                { value: 'llamada', label: 'Llamada' },
                { value: 'redes_sociales', label: 'Redes Sociales' },
                { value: 'otro', label: 'Otro' },
              ].map((item) => (
                <TouchableOpacity key={item.value} style={[styles.chip, source === item.value && styles.sourceChipActive]} onPress={() => setSource(item.value)}>
                  <Text style={[styles.chipText, source === item.value && styles.chipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  radioGroup: { flexDirection: 'row', gap: 12 },
  radioButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center' },
  radioButtonActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  radioText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  radioTextActive: { color: '#fff' },
  statusSelector: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', marginRight: 8 },
  chipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  sourceChipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  submitButton: { backgroundColor: '#f59e0b' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDisabled: { opacity: 0.6 },
});
