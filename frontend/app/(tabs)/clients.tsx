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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientsAPI } from '../../src/api/client';
import { Client } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts, brandColors, spacing, borderRadius, shadows } from '../../src/theme';
import WhatsAppButton from '../../src/components/WhatsAppButton';

export default function ClientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const data = await clientsAPI.getAll();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        (client.email && client.email.toLowerCase().includes(query))
    );
    setFilteredClients(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadClients();
  };

  const styles = createStyles(colors, insets);

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => router.push(`/client/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientInitial}>{item.name[0].toUpperCase()}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <View style={styles.clientDetails}>
          <Ionicons name="call" size={12} color={colors.textMuted} />
          <Text style={styles.clientDetail}>{item.phone}</Text>
          <WhatsAppButton phone={item.phone} size={16} />
        </View>
        {item.email && (
          <View style={styles.clientDetails}>
            <Ionicons name="mail" size={12} color={colors.textMuted} />
            <Text style={styles.clientDetail}>{item.email}</Text>
          </View>
        )}
        <View style={styles.propertiesBadge}>
          <Ionicons name="home" size={12} color={brandColors.clients} />
          <Text style={styles.propertiesText}>
            {item.properties_count || 0} {item.properties_count === 1 ? 'propiedad' : 'propiedades'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={brandColors.clients} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Clientes</Text>
          <Text style={styles.headerSubtitle}>{clients.length} registrados</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/client/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar clientes..."
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

      {filteredClients.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={48} color={brandColors.clients} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Sin resultados' : 'Sin clientes'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'No se encontraron clientes con ese criterio' 
              : 'Agrega tu primer cliente para empezar'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => router.push('/client/add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Agregar Cliente</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredClients}
          renderItem={renderClient}
          estimatedItemSize={100}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={brandColors.clients}
              colors={[brandColors.clients]}
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
      backgroundColor: brandColors.clients,
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
    clientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    clientAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: brandColors.clientsLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    clientInitial: {
      fontWeight: '700',
      fontSize: 22,
      color: brandColors.clients,
    },
    clientInfo: {
      flex: 1,
    },
    clientName: {
      fontWeight: '600',
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    clientDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      gap: 4,
    },
    clientDetail: {
      fontWeight: '400',
      fontSize: 13,
      color: colors.textMuted,
      marginRight: 6,
    },
    propertiesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: brandColors.clientsLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 6,
      alignSelf: 'flex-start',
      gap: 4,
    },
    propertiesText: {
      fontWeight: '500',
      fontSize: 11,
      color: brandColors.clients,
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
      backgroundColor: brandColors.clientsLight,
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
      backgroundColor: brandColors.clients,
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
