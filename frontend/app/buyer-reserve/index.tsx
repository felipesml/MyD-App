import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buyerReservesAPI } from '../../src/api/client';
import { BuyerReserve } from '../../src/types';
import WhatsAppButton from '../../src/components/WhatsAppButton';

export default function BuyerReserveListScreen() {
  const router = useRouter();
  const [buyerReserves, setBuyerReserves] = useState<BuyerReserve[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBuyerReserves = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }
    try {
      const data = await buyerReservesAPI.getAll();
      setBuyerReserves(data);
    } catch (error: any) {
      console.error('Error fetching buyer reserves:', error);
      Alert.alert('Error', 'No se pudieron cargar los compradores en reserva');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBuyerReserves();
    }, [])
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      contado: 'Contado',
      credito: 'Crédito',
      leasing: 'Leasing',
      otro: 'Otro',
    };
    return labels[method] || method;
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

  const renderItem = ({ item }: { item: BuyerReserve }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/buyer-reserve/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardName}>
            {item.first_name} {item.last_name}
          </Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={14} color="#6b7280" />
            <Text style={styles.cardPhone}>{item.phone}</Text>
            <WhatsAppButton phone={item.phone} size={18} />
          </View>
        </View>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: getPaymentMethodColor(item.payment_method) + '20' },
          ]}
        >
          <Text
            style={[
              styles.paymentBadgeText,
              { color: getPaymentMethodColor(item.payment_method) },
            ]}
          >
            {getPaymentMethodLabel(item.payment_method)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.budgetContainer}>
          <Ionicons name="wallet-outline" size={18} color="#10b981" />
          <Text style={styles.budgetLabel}>Presupuesto:</Text>
          <Text style={styles.budgetValue}>{formatCurrency(item.budget)}</Text>
        </View>

        {item.email && (
          <View style={styles.emailContainer}>
            <Ionicons name="mail-outline" size={14} color="#6b7280" />
            <Text style={styles.emailText}>{item.email}</Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Registrado: {new Date(item.created_at).toLocaleDateString('es-CL')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Sin compradores en reserva</Text>
      <Text style={styles.emptyDescription}>
        Registra compradores que tienen presupuesto pero aún no han elegido una propiedad
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/buyer-reserve/add')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Agregar Comprador</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compradores en Reserva</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compradores en Reserva</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/buyer-reserve/add')}
        >
          <Ionicons name="add" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={buyerReserves}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchBuyerReserves(true)}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    padding: 8,
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#374151',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  notesContainer: {
    marginTop: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
