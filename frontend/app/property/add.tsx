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
import { propertiesAPI, clientsAPI } from '../../src/api/client';
import { Client } from '../../src/types';
import * as ImagePicker from 'expo-image-picker';

export default function AddPropertyScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
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
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  useEffect(() => {
    loadClients();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para agregar imágenes');
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsAPI.getAll();
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setIsLoadingClients(false);
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
    if (!title.trim() || !address.trim() || !city.trim() || !price.trim() || !selectedClientId) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      await propertiesAPI.create({
        client_id: selectedClientId,
        title: title.trim(),
        address: address.trim(),
        city: city.trim(),
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

  if (isLoadingClients) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  if (clients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>No hay clientes registrados</Text>
        <Text style={styles.emptySubtext}>Primero debes agregar un cliente (dueño de la propiedad)</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/client/add')}>
          <Text style={styles.emptyButtonText}>Agregar Cliente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Cliente (Dueño) <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal style={styles.clientSelector}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.clientChip,
                    selectedClientId === client.id && styles.clientChipActive,
                  ]}
                  onPress={() => setSelectedClientId(client.id)}
                >
                  <Text
                    style={[
                      styles.clientChipText,
                      selectedClientId === client.id && styles.clientChipTextActive,
                    ]}
                  >
                    {client.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            <ScrollView horizontal style={styles.typeSelector}>
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
                placeholder="3"
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
                placeholder="2"
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
                placeholder="120"
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
                placeholder="2"
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
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera" size={24} color="#3b82f6" />
              <Text style={styles.addImageText}>Agregar Imagen</Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <ScrollView horizontal style={styles.imagesContainer}>
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
    </KeyboardAvoidingView>
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
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    height: 100,
    paddingTop: 12,
  },
  clientSelector: {
    flexDirection: 'row',
  },
  clientChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  clientChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  clientChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clientChipTextActive: {
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
