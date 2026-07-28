import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { leadsAPI } from '../../src/api/client';
import { Lead } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts, brandColors, spacing, borderRadius, shadows } from '../../src/theme';
import WhatsAppButton from '../../src/components/WhatsAppButton';

const STATUS_COLORS: Record<string, string> = {
  nuevo: '#3b82f6',
  contactado: '#f59e0b',
  visita_programada: '#8b5cf6',
  negociacion: '#06b6d4',
  cerrado: '#10b981',
  perdido: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  visita_programada: 'Visita',
  negociacion: 'Negociación',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
};

export default function LeadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [])
  );

  useEffect(() => {
    filterLeads();
  }, [searchQuery, filterStatus, leads]);

  const loadLeads = async () => {
    try {
      const data = await leadsAPI.getAll();
      setLeads(data);
      setFilteredLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (filterStatus) {
      filtered = filtered.filter((lead) => lead.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.phone.toLowerCase().includes(query) ||
          (lead.email && lead.email.toLowerCase().includes(query))
      );
    }

    setFilteredLeads(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLeads();
  };

  const styles = createStyles(colors, insets);

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity 
      style={styles.leadCard} 
      onPress={() => router.push(`/lead/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadAvatar}>
          <Text style={styles.leadInitial}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <View style={styles.leadDetails}>
            <Ionicons name="call" size={12} color={colors.textMuted} />
            <Text style={styles.leadDetail}>{item.phone}</Text>
            <WhatsAppButton phone={item.phone} size={16} />
          </View>
          {item.email && (
            <View style={styles.leadDetails}>
              <Ionicons name="mail" size={12} color={colors.textMuted} />
              <Text style={styles.leadDetail}>{item.email}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.leadFooter}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
        <View style={styles.interestBadge}>
          <Ionicons 
            name={item.interest_type === 'compra' ? 'cart' : 'key'} 
            size={14} 
            color={brandColors.leads} 
          />
          <Text style={styles.interestText}>
            {item.interest_type === 'compra' ? 'Compra' : 'Arriendo'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={brandColors.leads} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Leads</Text>
          <Text style={styles.headerSubtitle}>{leads.length} prospectos</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/lead/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar leads..."
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

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
          onPress={() => setFilterStatus(null)}
        >
          <Text style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterChip, 
              filterStatus === key && { backgroundColor: STATUS_COLORS[key], borderColor: STATUS_COLORS[key] }
            ]}
            onPress={() => setFilterStatus(filterStatus === key ? null : key)}
          >
            <Text style={[
              styles.filterChipText, 
              filterStatus === key && styles.filterChipTextActive
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredLeads.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="star-outline" size={48} color={brandColors.leads} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery || filterStatus ? 'Sin resultados' : 'Sin leads'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery || filterStatus 
              ? 'No se encontraron leads con ese criterio' 
              : 'Agrega tu primer lead para empezar'}
          </Text>
          {!searchQuery && !filterStatus && (
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => router.push('/lead/add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Agregar Lead</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredLeads}
          renderItem={renderLead}
          estimatedItemSize={140}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={brandColors.leads}
              colors={[brandColors.leads]}
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
      backgroundColor: brandColors.leads,
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
      marginTop: spacing.md,
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
    filterScroll: {
      flexGrow: 0,
      maxHeight: 48,
    },
    filterContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
    },
    filterChipActive: {
      backgroundColor: brandColors.leads,
      borderColor: brandColors.leads,
    },
    filterChipText: {
      fontWeight: '500',
      fontSize: 12,
      color: colors.textMuted,
    },
    filterChipTextActive: {
      color: '#fff',
    },
    listContent: {
      padding: spacing.md,
    },
    leadCard: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    leadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    leadAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: brandColors.leadsLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    leadInitial: {
      fontWeight: '700',
      fontSize: 22,
      color: brandColors.leads,
    },
    leadInfo: {
      flex: 1,
    },
    leadName: {
      fontWeight: '600',
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    leadDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      gap: 4,
    },
    leadDetail: {
      fontWeight: '400',
      fontSize: 13,
      color: colors.textMuted,
      marginRight: 6,
    },
    leadFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontWeight: '600',
      fontSize: 12,
    },
    interestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: brandColors.leadsLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 4,
    },
    interestText: {
      fontWeight: '500',
      fontSize: 12,
      color: brandColors.leads,
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
      backgroundColor: brandColors.leadsLight,
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
      backgroundColor: brandColors.leads,
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
