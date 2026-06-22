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
import { leadsAPI } from '../../src/api/client';
import { Lead } from '../../src/types';

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
  visita_programada: 'Visita Programada',
  negociacion: 'Negociación',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
};

export default function LeadsScreen() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

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

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity style={styles.leadCard} onPress={() => router.push(`/lead/${item.id}`)}>
      <View style={styles.leadHeader}>
        <View style={styles.leadAvatar}>
          <Text style={styles.leadInitial}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <View style={styles.leadDetails}>
            <Ionicons name="call" size={12} color="#6b7280" />
            <Text style={styles.leadDetail}>{item.phone}</Text>
          </View>
          {item.email && (
            <View style={styles.leadDetails}>
              <Ionicons name="mail" size={12} color="#6b7280" />
              <Text style={styles.leadDetail}>{item.email}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.leadFooter}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
        <View style={styles.interestBadge}>
          <Ionicons name={item.interest_type === 'compra' ? 'cart' : 'key'} size={12} color="#6b7280" />
          <Text style={styles.interestText}>{item.interest_type === 'compra' ? 'Compra' : 'Arriendo'}</Text>
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
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/lead/add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar leads..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
          onPress={() => setFilterStatus(null)}
        >
          <Text style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'nuevo' && styles.filterChipActive]}
          onPress={() => setFilterStatus(filterStatus === 'nuevo' ? null : 'nuevo')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'nuevo' && styles.filterChipTextActive]}>
            Nuevos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'contactado' && styles.filterChipActive]}
          onPress={() => setFilterStatus(filterStatus === 'contactado' ? null : 'contactado')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'contactado' && styles.filterChipTextActive]}>
            Contactados
          </Text>
        </TouchableOpacity>
      </View>

      {filteredLeads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>
            {searchQuery || filterStatus ? 'No se encontraron leads' : 'No hay leads registrados'}
          </Text>
          {!searchQuery && !filterStatus && (
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/lead/add')}>
              <Text style={styles.emptyButtonText}>Agregar primer lead</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredLeads}
          renderItem={renderLead}
          estimatedItemSize={120}
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
    marginHorizontal: 16,
    marginTop: 16,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  leadCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leadInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  leadDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  leadDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  leadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interestText: {
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