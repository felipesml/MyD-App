import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buyerReservesAPI } from '../../src/api/client';
import { BuyerReserve } from '../../src/types';
import WhatsAppButton from '../../src/components/WhatsAppButton';

type PaymentMethod = 'contado' | 'credito' | 'leasing' | 'otro';

export default function BuyerReserveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [buyerReserve, setBuyerReserve] = useState<BuyerReserve | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contado');
  const [notes, setNotes] = useState('');

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'contado', label: 'Contado' },
    { value: 'credito', label: 'Crédito' },
    { value: 'leasing', label: 'Leasing' },
    { value: 'otro', label: 'Otro' },
  ];

  useEffect(() => {
    fetchBuyerReserve();
  }, [id]);

  const fetchBuyerReserve = async () => {
    if (!id) return;
    try {
      const data = await buyerReservesAPI.getById(id);
      setBuyerReserve(data);
      // Initialize form with data
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setEmail(data.email || '');
      setPhone(data.phone);
      setBudget(data.budget.toString());
      setPaymentMethod(data.payment_method);
      setNotes(data.notes || '');
    } catch (error: any) {
      console.error('Error fetching buyer reserve:', error);
      Alert.alert('Error', 'No se pudo cargar el comprador en reserva', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert('Error', 'El nombre, apellido y teléfono son obligatorios');
      return;
    }

    if (!budget || isNaN(parseFloat(budget))) {
      Alert.alert('Error', 'El presupuesto es obligatorio y debe ser un número válido');
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = await buyerReservesAPI.update(id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        budget: parseFloat(budget.replace(/[^0-9]/g, '')),
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });
      setBuyerReserve(updatedData);
      setIsEditing(false);
      Alert.alert('Éxito', 'Comprador en reserva actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating buyer reserve:', error);
      Alert.alert('Error', error.message || 'Error al actualizar el comprador en reserva');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Comprador',
      `¿Estás seguro de que deseas eliminar a ${buyerReserve?.first_name} ${buyerReserve?.last_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await buyerReservesAPI.delete(id!);
              Alert.alert('Éxito', 'Comprador eliminado correctamente', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error deleting buyer reserve:', error);
              Alert.alert('Error', error.message || 'Error al eliminar el comprador');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9]/g, '')) : value;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const handleBudgetChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setBudget(numericValue);
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      contado: '#10b981',
      credito: '#3b82f6',
      leasing: '#f59e0b',
      otro: '#6b7280',
    };
    return colors[method] || '#6b7280';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!buyerReserve) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Comprador no encontrado</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Comprador' : 'Detalle'}
          </Text>
          <View style={styles.headerActions}>
            {!isEditing && (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.headerButton}
                >
                  <Ionicons name="create-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {isEditing ? (
            // Edit Mode
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nombre <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Apellido <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apellido"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Teléfono <Text style={styles.required}>*</Text>
                  </Text>
                  <WhatsAppButton phone={phone} size={20} disabled={!phone.trim()} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="+56912345678"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Presupuesto (CLP) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="50.000.000"
                  value={budget ? formatCurrency(budget).replace('$', '').trim() : ''}
                  onChangeText={handleBudgetChange}
                  keyboardType="numeric"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Método de Pago</Text>
                <View style={styles.paymentMethodContainer}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === method.value && styles.paymentMethodButtonActive,
                      ]}
                      onPress={() => setPaymentMethod(method.value)}
                      disabled={isSaving}
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === method.value && styles.paymentMethodTextActive,
                        ]}
                      >
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notas</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Preferencias, requisitos especiales, etc."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    setFirstName(buyerReserve.first_name);
                    setLastName(buyerReserve.last_name);
                    setEmail(buyerReserve.email || '');
                    setPhone(buyerReserve.phone);
                    setBudget(buyerReserve.budget.toString());
                    setPaymentMethod(buyerReserve.payment_method);
                    setNotes(buyerReserve.notes || '');
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // View Mode
            <View style={styles.detailContainer}>
              <View style={styles.profileSection}>
                <View style={styles.avatarLarge}>
                  <Ionicons name="person" size={48} color="#fff" />
                </View>
                <Text style={styles.profileName}>
                  {buyerReserve.first_name} {buyerReserve.last_name}
                </Text>
                <View
                  style={[
                    styles.paymentBadgeLarge,
                    { backgroundColor: getPaymentMethodColor(buyerReserve.payment_method) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentBadgeTextLarge,
                      { color: getPaymentMethodColor(buyerReserve.payment_method) },
                    ]}
                  >
                    {paymentMethods.find((m) => m.value === buyerReserve.payment_method)?.label}
                  </Text>
                </View>
              </View>

              <View style={styles.budgetCard}>
                <Ionicons name="wallet" size={28} color="#10b981" />
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetLabel}>Presupuesto</Text>
                  <Text style={styles.budgetValueLarge}>
                    {formatCurrency(buyerReserve.budget)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Información de Contacto</Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{buyerReserve.phone}</Text>
                  </View>
                  <WhatsAppButton phone={buyerReserve.phone} size={24} />
                </View>

                {buyerReserve.email && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="mail" size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{buyerReserve.email}</Text>
                    </View>
                  </View>
                )}
              </View>

              {buyerReserve.notes && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Notas</Text>
                  <Text style={styles.notesContent}>{buyerReserve.notes}</Text>
                </View>
              )}

              <View style={styles.metaInfo}>
                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                <Text style={styles.metaText}>
                  Registrado el {new Date(buyerReserve.created_at).toLocaleDateString('es-CL')}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButtonLarge: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // View Mode Styles
  detailContainer: {
    gap: 16,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  paymentBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentBadgeTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  budgetValueLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  notesContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  // Edit Mode Styles
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    height: 100,
    paddingTop: 12,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  paymentMethodTextActive: {
    color: '#fff',
  },
  editButtons: {
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
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
});
