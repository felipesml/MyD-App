import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { propertiesAPI } from '../../src/api/client';
import { Property } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
  disponible: '#10b981',
  reservada: '#f59e0b',
  vendida: '#3b82f6',
  arrendada: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  reservada: 'Reservada',
  vendida: 'Vendida',
  arrendada: 'Arrendada',
};

const TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
  oficina: 'Oficina',
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [id])
  );

  const loadProperty = async () => {
    if (!id) return;
    try {
      const data = await propertiesAPI.getById(id);
      setProperty(data);
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Error', 'No se pudo cargar la propiedad', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar Propiedad', `¿Eliminar "${property?.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await propertiesAPI.delete(id!);
            Alert.alert('Éxito', 'Propiedad eliminada', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al eliminar');
          }
        },
      },
    ]);
  };

  const openMaps = () => {
    if (!property) return;
    const query = encodeURIComponent(`${property.address}, ${property.city}, ${property.region}`);
    const url = Platform.select({
      ios: `maps://?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url!).catch(() => {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir el mapa');
      });
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

  const styles = createStyles(colors, insets);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Propiedad no encontrada</Text>
      </View>
    );
  }

  const images = property.images || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Image gallery */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {images.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, activeImage === index && styles.dotActive]}
                  />
                ))}
              </View>
            )}
            <View style={[styles.statusFloat, { backgroundColor: STATUS_COLORS[property.status] }]}>
              <Text style={styles.statusFloatText}>{STATUS_LABELS[property.status]}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="business" size={56} color="#10b981" />
            <View style={[styles.statusFloat, { backgroundColor: STATUS_COLORS[property.status] }]}>
              <Text style={styles.statusFloatText}>{STATUS_LABELS[property.status]}</Text>
            </View>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>

          <TouchableOpacity style={styles.addressRow} onPress={openMaps} activeOpacity={0.7}>
            <Ionicons name="location" size={18} color="#10b981" />
            <Text style={styles.addressText}>
              {property.address}, {property.city}, {property.region}
            </Text>
            <Ionicons name="open-outline" size={16} color="#10b981" />
          </TouchableOpacity>

          <View style={styles.featuresRow}>
            {property.bedrooms != null && (
              <Feature icon="bed-outline" label={`${property.bedrooms} dorm`} colors={colors} />
            )}
            {property.bathrooms != null && (
              <Feature icon="water-outline" label={`${property.bathrooms} baños`} colors={colors} />
            )}
            {property.area_m2 != null && (
              <Feature icon="resize-outline" label={`${property.area_m2} m²`} colors={colors} />
            )}
            {property.parking_spots != null && (
              <Feature icon="car-outline" label={`${property.parking_spots} est`} colors={colors} />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <InfoRow icon="home-outline" text={`Tipo: ${TYPE_LABELS[property.property_type]}`} colors={colors} />
            <InfoRow
              icon="pricetag-outline"
              text={`Transacción: ${property.transaction_type === 'venta' ? 'Venta' : 'Arriendo'}`}
              colors={colors}
            />
            {property.client_name && (
              <InfoRow icon="person-outline" text={`Propietario: ${property.client_name}`} colors={colors} />
            )}
          </View>

          {property.description ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descText}>{property.description}</Text>
            </View>
          ) : null}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/property/edit/${id}`)}>
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Feature({ icon, label, colors }: { icon: any; label: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{label}</Text>
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
    galleryImage: { width, height: 240 },
    noImage: {
      width: '100%',
      height: 200,
      backgroundColor: '#d1fae5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dotsContainer: {
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: '#fff' },
    statusFloat: {
      position: 'absolute',
      top: 12,
      right: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusFloatText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    body: { padding: 16 },
    title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
    price: { fontSize: 24, fontWeight: '700', color: '#10b981', marginBottom: 12 },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
    },
    addressText: { flex: 1, fontSize: 14, color: colors.text },
    featuresRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 10,
      marginBottom: 16,
    },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
    descText: { fontSize: 15, color: colors.text, lineHeight: 22 },
    buttonsContainer: { flexDirection: 'row', gap: 12 },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
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
