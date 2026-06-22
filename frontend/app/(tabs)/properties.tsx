import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { propertiesAPI } from '../../src/api/client';
import { Property } from '../../src/types';

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

export default function PropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, properties]);

  const loadProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterProperties = () => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(
      (property) =>
        property.title.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        (property.client_name && property.client_name.toLowerCase().includes(query))
    );
    setFilteredProperties(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProperties();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.propertyCard} onPress={() => router.push(`/property/${item.id}`)}>
      {item.images && item.images.length > 0 ? (
        <View style={styles.propertyImage}>
          <Text style={styles.placeholderText}>Imagen</Text>
        </View>
      ) : (
        <View style={styles.propertyImagePlaceholder}>
          <Ionicons name="home" size={32} color="#9ca3af" />
        </View>
      )}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.propertyDetails}>
          <Ionicons name="location" size={12} color="#6b7280" />
          <Text style={styles.propertyDetail} numberOfLines={1}>
            {item.address}, {item.city}
          </Text>
        </View>
        <Text style={styles.propertyPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.propertyFeatures}>
          {item.bedrooms !== null && item.bedrooms !== undefined && (
            <View style={styles.feature}>
              <Ionicons name="bed" size={14} color="#6b7280" />
              <Text style={styles.featureText}>{item.bedrooms}</Text>
            </View>
          )}
          {item.bathrooms !== null && item.bathrooms !== undefined && (
            <View style={styles.feature}>
              <Ionicons name="water" size={14} color="#6b7280" />
              <Text style={styles.featureText}>{item.bathrooms}</Text>
            </View>
          )}
          {item.area_m2 && (
            <View style={styles.feature}>
              <Ionicons name="expand" size={14} color="#6b7280" />
              <Text style={styles.featureText}>{item.area_m2}m²</Text>
            </View>
          )}
        </View>
        <View style={styles.propertyFooter}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
          <Text style={styles.ownerText}>{item.client_name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Propiedades</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/property/add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar propiedades..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredProperties.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron propiedades' : 'No hay propiedades registradas'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/property/add')}>
              <Text style={styles.emptyButtonText}>Agregar primera propiedad</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredProperties}
          renderItem={renderProperty}
          estimatedItemSize={200}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  propertyFeatures: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ownerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
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
});