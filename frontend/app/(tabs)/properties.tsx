import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { propertiesAPI } from '../../src/api/client';
import { Property } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts, brandColors, spacing, borderRadius, shadows } from '../../src/theme';

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
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [])
  );

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

  const styles = createStyles(colors, insets);

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity 
      style={styles.propertyCard} 
      onPress={() => router.push(`/property/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.propertyImagePlaceholder}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.propertyImage} resizeMode="cover" />
        ) : (
          <View style={styles.propertyIconContainer}>
            <Ionicons name="business" size={32} color={brandColors.properties} />
          </View>
        )}
        <View style={[styles.statusBadgeFloat, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeFloatText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.propertyLocation}>
          <Ionicons name="location" size={14} color={brandColors.properties} />
          <Text style={styles.propertyLocationText} numberOfLines={1}>
            {item.address}, {item.city}
          </Text>
        </View>
        <Text style={styles.propertyPrice}>{formatPrice(item.price)}</Text>
        
        <View style={styles.propertyFeatures}>
          {item.bedrooms !== null && item.bedrooms !== undefined && (
            <View style={styles.feature}>
              <Ionicons name="bed-outline" size={16} color={colors.textMuted} />
              <Text style={styles.featureText}>{item.bedrooms}</Text>
            </View>
          )}
          {item.bathrooms !== null && item.bathrooms !== undefined && (
            <View style={styles.feature}>
              <Ionicons name="water-outline" size={16} color={colors.textMuted} />
              <Text style={styles.featureText}>{item.bathrooms}</Text>
            </View>
          )}
          {item.area_m2 && (
            <View style={styles.feature}>
              <Ionicons name="resize-outline" size={16} color={colors.textMuted} />
              <Text style={styles.featureText}>{item.area_m2}m²</Text>
            </View>
          )}
        </View>
        
        {item.client_name && (
          <View style={styles.ownerContainer}>
            <Ionicons name="person-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.ownerText}>Propietario: {item.client_name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={brandColors.properties} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inmuebles</Text>
          <Text style={styles.headerSubtitle}>{properties.length} propiedades</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/property/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar propiedades..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {filteredProperties.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="business-outline" size={48} color={brandColors.properties} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Sin resultados' : 'Sin propiedades'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'No se encontraron propiedades con ese criterio' 
              : 'Agrega tu primera propiedad para empezar'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => router.push('/property/add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Agregar Propiedad</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredProperties}
          renderItem={renderProperty}
          estimatedItemSize={280}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={brandColors.properties}
              colors={[brandColors.properties]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontWeight: '700',
      fontSize: 28,
      color: colors.text,
    },
    headerSubtitle: {
      fontWeight: '400',
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
    },
    addButton: {
      backgroundColor: brandColors.properties,
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: spacing.md,
      marginVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontWeight: '400',
      fontSize: 16,
      color: colors.text,
    },
    listContent: {
      padding: spacing.md,
    },
    propertyCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    propertyImagePlaceholder: {
      width: '100%',
      height: 140,
      backgroundColor: brandColors.propertiesLight,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    propertyImage: {
      width: '100%',
      height: '100%',
    },
    propertyIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusBadgeFloat: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusBadgeFloatText: {
      fontWeight: '600',
      fontSize: 12,
      color: '#fff',
    },
    propertyInfo: {
      padding: spacing.md,
    },
    propertyTitle: {
      fontWeight: '600',
      fontSize: 18,
      color: colors.text,
      marginBottom: 6,
    },
    propertyLocation: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: 4,
    },
    propertyLocationText: {
      fontWeight: '400',
      fontSize: 13,
      color: colors.textMuted,
      flex: 1,
    },
    propertyPrice: {
      fontWeight: '700',
      fontSize: 22,
      color: brandColors.properties,
      marginBottom: spacing.sm,
    },
    propertyFeatures: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    featureText: {
      fontWeight: '500',
      fontSize: 14,
      color: colors.textMuted,
    },
    ownerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: spacing.sm,
    },
    ownerText: {
      fontWeight: '400',
      fontSize: 13,
      color: colors.textMuted,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: brandColors.propertiesLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontWeight: '700',
      fontSize: 20,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyText: {
      fontWeight: '400',
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: brandColors.properties,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
    },
    emptyButtonText: {
      fontWeight: '600',
      color: '#fff',
      fontSize: 16,
    },
  });
