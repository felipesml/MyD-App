import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { dashboardAPI, activitiesAPI } from '../../src/api/client';
import { DashboardStats, Activity } from '../../src/types';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const router = useRouter();
  const { agent, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, activitiesData] = await Promise.all([
        dashboardAPI.getStats(),
        activitiesAPI.getAll(20),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_added':
        return 'person-add';
      case 'lead_added':
        return 'star';
      case 'property_added':
        return 'home';
      case 'appointment_created':
        return 'calendar';
      case 'lead_status_changed':
        return 'swap-horizontal';
      case 'property_status_changed':
        return 'swap-horizontal';
      default:
        return 'information-circle';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {agent?.name}</Text>
          <Text style={styles.subGreeting}>Bienvenido a tu CRM</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="people" size={32} color="#3b82f6" />
            <Text style={styles.statValue}>{stats?.total_clients || 0}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="star" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{stats?.total_leads || 0}</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="home" size={32} color="#10b981" />
            <Text style={styles.statValue}>{stats?.total_properties || 0}</Text>
            <Text style={styles.statLabel}>Propiedades</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
            <Ionicons name="calendar" size={32} color="#6366f1" />
            <Text style={styles.statValue}>{stats?.upcoming_appointments || 0}</Text>
            <Text style={styles.statLabel}>Próximas Citas</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/client/add')}>
              <Ionicons name="person-add" size={28} color="#3b82f6" />
              <Text style={styles.actionText}>Nuevo Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/lead/add')}>
              <Ionicons name="star" size={28} color="#f59e0b" />
              <Text style={styles.actionText}>Nuevo Lead</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/property/add')}>
              <Ionicons name="home" size={28} color="#10b981" />
              <Text style={styles.actionText}>Nueva Propiedad</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/appointment/add')}>
              <Ionicons name="calendar" size={28} color="#6366f1" />
              <Text style={styles.actionText}>Nueva Cita</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buyer Reserve Quick Access */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.buyerReserveCard} 
            onPress={() => router.push('/buyer-reserve')}
          >
            <View style={styles.buyerReserveIcon}>
              <Ionicons name="wallet" size={32} color="#fff" />
            </View>
            <View style={styles.buyerReserveContent}>
              <Text style={styles.buyerReserveTitle}>Compradores en Reserva</Text>
              <Text style={styles.buyerReserveDescription}>
                Gestiona compradores con presupuesto disponible
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No hay actividades recientes</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {activities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name={getActivityIcon(activity.type) as any} size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {format(new Date(activity.timestamp), "d 'de' MMMM, HH:mm")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 14,
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  buyerReserveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  buyerReserveIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buyerReserveContent: {
    flex: 1,
  },
  buyerReserveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  buyerReserveDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
});