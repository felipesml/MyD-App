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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { propertiesAPI } from '../../../src/api/client';
import { Client } from '../../../src/types';
import ClientSelectorModal from '../../../src/components/ClientSelectorModal';
import { useRegion } from '../../../src/contexts/RegionContext';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getFilteredRegions } = useRegion();
  const availableRegions = getFilteredRegions();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientId, setClientId] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [price, setPrice] = useState('');
  const [propertyType, setPropertyType] = useState<'casa' | 'apartamento' | 'terreno' | 'comercial' | 'oficina'>('casa');
  const [transactionType, setTransactionType] = useState<'venta' | 'arriendo'>('venta');
  const [status, setStatus] = useState('disponible');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    if (!id) return;
    try {
      const p = await propertiesAPI.getById(id);
      setTitle(p.title);
      setAddress(p.address);
      setCity(p.city);
      setRegion(p.region);
      setPrice(String(p.price));
      setPropertyType(p.property_type);
      setTransactionType(p.transaction_type);
      setStatus(p.status);
      setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '');
      setBathrooms(p.bathrooms != null ? String(p.bathrooms) : '');
      setAreaM2(p.area_m2 != null ? String(p.area_m2) : '');
      setParkingSpots(p.parking_spots != null ? String(p.parking_spots) : '');
      setDescription(p.description || '');
      setImages(p.images || []);
      setClientId(p.client_id);
      if (p.client_name) {
        setSelectedClient({ id: p.client_id, name: p.client_name, phone: '' } as Client);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la propiedad', [{ text: 'OK', onPress: () => router.back() }]);
    } finally {
      setIsFetching(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Agregar Imagen', 'Selecciona una opción', [
      { text: 'Tomar Foto', onPress: takePhoto },
      { text: 'Elegir de Galería', onPress: pickImage },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  const setCover = (index: number) => {
    // Move selected image to the front (cover)
    const reordered = [...images];
    const [img] = reordered.splice(index, 1);
    reordered.unshift(img);
    setImages(reordered);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !address.trim() || !city.trim() || !price.trim() || !clientId) {
      Alert.alert('Error', 'Completa los campos obligatorios y selecciona un cliente');
      return;
    }
    setIsLoading(true);
    try {
      await propertiesAPI.update(id!, {
        client_id: clientId,
        title: title.trim(),
        address: address.trim(),
        city: city.trim(),
        region,
        price: parseFloat(price),
        property_type: propertyType,
        transaction_type: transactionType,
        status: status as any,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        area_m2: areaM2 ? parseFloat(areaM2) : undefined,
        parking_spots: parkingSpots ? parseInt(parkingSpots) : undefined,
        description: description.trim() || undefined,
        features: [],
        images,
      });
      Alert.alert('Éxito', 'Propiedad actualizada', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cliente (Dueño) <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity style={styles.selectClientButton} onPress={() => setShowClientModal(true)}>
              <Ionicons name="person" size={20} color="#3b82f6" />
              <Text style={styles.selectClientText}>{selectedClient ? selectedClient.name : 'Seleccionar Cliente'}</Text>
              <Ionicons name="swap-horizontal" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ciudad <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Región <Text style={styles.required}>*</Text></Text>
            <ScrollView horizontal style={{ flexDirection: 'row' }} showsHorizontalScrollIndicator={false}>
              {availableRegions.map((reg) => (
                <TouchableOpacity key={reg} style={[styles.chip, region === reg && styles.chipActive]} onPress={() => setRegion(reg)}>
                  <Text style={[styles.chipText, region === reg && styles.chipTextActive]}>{reg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio (CLP) <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" editable={!isLoading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Propiedad</Text>
            <ScrollView horizontal style={{ flexDirection: 'row' }} showsHorizontalScrollIndicator={false}>
              {(['casa', 'apartamento', 'terreno', 'comercial', 'oficina'] as const).map((type) => (
                <TouchableOpacity key={type} style={[styles.chip, propertyType === type && styles.chipActive]} onPress={() => setPropertyType(type)}>
                  <Text style={[styles.chipText, propertyType === type && styles.chipTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estado</Text>
            <ScrollView horizontal style={{ flexDirection: 'row' }} showsHorizontalScrollIndicator={false}>
              {[
                { v: 'disponible', l: 'Disponible' },
                { v: 'reservada', l: 'Reservada' },
                { v: 'vendida', l: 'Vendida' },
                { v: 'arrendada', l: 'Arrendada' },
              ].map((item) => (
                <TouchableOpacity key={item.v} style={[styles.chip, status === item.v && styles.chipActive]} onPress={() => setStatus(item.v)}>
                  <Text style={[styles.chipText, status === item.v && styles.chipTextActive]}>{item.l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transacción</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={[styles.radioButton, transactionType === 'venta' && styles.radioButtonActive]} onPress={() => setTransactionType('venta')}>
                <Text style={[styles.radioText, transactionType === 'venta' && styles.radioTextActive]}>Venta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.radioButton, transactionType === 'arriendo' && styles.radioButtonActive]} onPress={() => setTransactionType('arriendo')}>
                <Text style={[styles.radioText, transactionType === 'arriendo' && styles.radioTextActive]}>Arriendo</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Dormitorios</Text>
              <TextInput style={styles.input} value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" editable={!isLoading} />
            </View>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Baños</Text>
              <TextInput style={styles.input} value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric" editable={!isLoading} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Área (m²)</Text>
              <TextInput style={styles.input} value={areaM2} onChangeText={setAreaM2} keyboardType="numeric" editable={!isLoading} />
            </View>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Estacionamientos</Text>
              <TextInput style={styles.input} value={parkingSpots} onChangeText={setParkingSpots} keyboardType="numeric" editable={!isLoading} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" editable={!isLoading} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imágenes</Text>
            <Text style={styles.helperText}>La primera imagen se usa como portada. Toca "Portada" para elegir otra.</Text>
            <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={22} color="#10b981" />
              <Text style={styles.addImageText}>Tomar Foto o Elegir Imagen</Text>
            </TouchableOpacity>
            {images.length > 0 && (
              <ScrollView horizontal style={{ marginTop: 8 }} showsHorizontalScrollIndicator={false}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.imageThumb} />
                    {index === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Portada</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                      <Ionicons name="close-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                    {index !== 0 && (
                      <TouchableOpacity style={styles.coverButton} onPress={() => setCover(index)}>
                        <Text style={styles.coverButtonText}>Portada</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
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

      <ClientSelectorModal
        visible={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSelectClient={(c) => { setSelectedClient(c); setClientId(c.id); }}
        selectedClientId={clientId}
      />
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
  helperText: { fontSize: 12, color: '#6b7280' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#111827' },
  textArea: { height: 100, paddingTop: 12 },
  selectClientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, padding: 14, gap: 8 },
  selectClientText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', marginRight: 8 },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  radioGroup: { flexDirection: 'row', gap: 12 },
  radioButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center' },
  radioButtonActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  radioText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  radioTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  addImageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#10b981', borderStyle: 'dashed', borderRadius: 8, padding: 14, gap: 8 },
  addImageText: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  imageWrapper: { marginRight: 12, position: 'relative' },
  imageThumb: { width: 110, height: 110, borderRadius: 8, backgroundColor: '#e5e7eb' },
  coverBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  coverButton: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  coverButtonText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  submitButton: { backgroundColor: '#10b981' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDisabled: { opacity: 0.6 },
});
