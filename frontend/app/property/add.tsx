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
import { propertiesAPI } from '../../src/api/client';
import { Client } from '../../src/types';
import * as ImagePicker from 'expo-image-picker';
import ClientSelectorModal from '../../src/components/ClientSelectorModal';

const REGIONES_CHILE = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana',
  'Región del Libertador General Bernardo O\'Higgins',
  'Región del Maule',
  'Región del Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén del General Carlos Ibáñez del Campo',
  'Región de Magallanes y de la Antártica Chilena',
];

export default function AddPropertyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('Región Metropolitana');
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

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const [mediaLibraryStatus, cameraStatus] = await Promise.all([
      ImagePicker.requestMediaLibraryPermissionsAsync(),
      ImagePicker.requestCameraPermissionsAsync(),
    ]);
    
    if (mediaLibraryStatus.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para agregar imágenes');
    }
    if (cameraStatus.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Agregar Imagen',
      'Selecciona una opción',
      [
        {
          text: 'Tomar Foto',
          onPress: () => takePhoto(),
        },
        {
          text: 'Elegir de Galería',
          onPress: () => pickImage(),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !address.trim() || !city.trim() || !price.trim() || !selectedClient) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios y selecciona un cliente');
      return;
    }

    setIsLoading(true);
    try {
      await propertiesAPI.create({
        client_id: selectedClient.id,
        title: title.trim(),
        address: address.trim(),
        city: city.trim(),
        region: region,
        price: parseFloat(price),
        property_type: propertyType,
        transaction_type: transactionType,
        status,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        area_m2: areaM2 ? parseFloat(areaM2) : undefined,
        parking_spots: parkingSpots ? parseInt(parkingSpots) : undefined,
        description: description.trim() || undefined,
        features: [],
        images,
      });

      Alert.alert('Éxito', 'Propiedad agregada correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating property:', error);
      Alert.alert('Error', error.message || 'Error al agregar la propiedad');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>
          {/* Cliente */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Cliente (Dueño) <Text style={styles.required}>*</Text>
            </Text>
            {selectedClient ? (
              <View style={styles.selectedClientCard}>
                <View style={styles.selectedClientInfo}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitial}>{selectedClient.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
                    <Text style={styles.selectedClientPhone}>{selectedClient.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowClientModal(true)}>
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.selectClientButton} onPress={() => setShowClientModal(true)}>
                <Ionicons name="person-add" size={24} color="#3b82f6" />
                <Text style={styles.selectClientText}>Seleccionar Cliente</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Título <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Casa de 3 dormitorios en Las Condes"
              value={title}
              onChangeText={setTitle}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Dirección <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Av. Principal 123"
              value={address}
              onChangeText={setAddress}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Ciudad <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Santiago"
              value={city}
              onChangeText={setCity}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Región <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal style={styles.regionSelector} showsHorizontalScrollIndicator={false}>
              {REGIONES_CHILE.map((reg) => (
                <TouchableOpacity
                  key={reg}
                  style={[styles.regionChip, region === reg && styles.regionChipActive]}
                  onPress={() => setRegion(reg)}
                >
                  <Text style={[styles.regionChipText, region === reg && styles.regionChipTextActive]}>
                    {reg.replace('Región de ', '').replace('Región del ', '').replace('Región ', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Precio (CLP) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="150000000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Propiedad</Text>
            <ScrollView horizontal style={styles.typeSelector} showsHorizontalScrollIndicator={false}>
              {(['casa', 'apartamento', 'terreno', 'comercial', 'oficina'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, propertyType === type && styles.typeChipActive]}
                  onPress={() => setPropertyType(type)}
                >
                  <Text style={[styles.typeChipText, propertyType === type && styles.typeChipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Transacción</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, transactionType === 'venta' && styles.radioButtonActive]}
                onPress={() => setTransactionType('venta')}
              >
                <Text style={[styles.radioText, transactionType === 'venta' && styles.radioTextActive]}>
                  Venta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, transactionType === 'arriendo' && styles.radioButtonActive]}
                onPress={() => setTransactionType('arriendo')}
              >
                <Text style={[styles.radioText, transactionType === 'arriendo' && styles.radioTextActive]}>
                  Arriendo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Dormitorios</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Baños</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Área (m²)</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={areaM2}
                onChangeText={setAreaM2}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Estacionamientos</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={parkingSpots}
                onChangeText={setParkingSpots}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción de la propiedad..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imágenes</Text>
            <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={24} color="#3b82f6" />
              <Text style={styles.addImageText}>Tomar Foto o Elegir Imagen</Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <ScrollView horizontal style={styles.imagesContainer} showsHorizontalScrollIndicator={false}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>Imagen {index + 1}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
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
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ClientSelectorModal
        visible={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSelectClient={setSelectedClient}
        selectedClientId={selectedClient?.id}
      />
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
    paddingBottom: 40,
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
    height: 100,
    paddingTop: 12,
  },
  selectClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  selectClientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  selectedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
  },
  selectedClientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  clientDetails: {
    flex: 1,
  },
  selectedClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedClientPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  regionSelector: {
    flexDirection: 'row',
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  regionChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  regionChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  regionChipTextActive: {
    color: '#fff',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#fff',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  radioTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imageWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#10b981',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
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
