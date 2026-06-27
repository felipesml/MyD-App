import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { dashboardAPI, activitiesAPI } from '../../src/api/client';
import { DashboardStats, Activity } from '../../src/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fonts, typography, brandColors, spacing, borderRadius, shadows } from '../../src/theme';

// Dynamic colors for dark mode support
const getStatCardColors = (isDark: boolean) => ({
  clients: {
    bg: isDark ? '#1e3a5f' : '#dbeafe',
    text: isDark ? '#60a5fa' : '#3b82f6',
  },
  leads: {
    bg: isDark ? '#451a03' : '#fef3c7',
    text: isDark ? '#fbbf24' : '#f59e0b',
  },
  properties: {
    bg: isDark ? '#064e3b' : '#d1fae5',
    text: isDark ? '#34d399' : '#10b981',
  },
  calendar: {
    bg: isDark ? '#4c1d95' : '#ede9fe',
    text: isDark ? '#a78bfa' : '#8b5cf6',
  },
  buyerReserve: {
    bg: isDark ? '#134e4a' : '#ccfbf1',
    text: isDark ? '#2dd4bf' : '#14b8a6',
  },
});

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { agent } = useAuth();
  const { colors, isDark } = useTheme();
  const statCardColors = getStatCardColors(isDark);
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
        activitiesAPI.getAll(10),
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_added':
        return { name: 'person-add', color: brandColors.clients };
      case 'lead_added':
        return { name: 'star', color: brandColors.leads };
      case 'property_added':
        return { name: 'home', color: brandColors.properties };
      case 'appointment_created':
        return { name: 'calendar', color: brandColors.calendar };
      case 'lead_status_changed':
        return { name: 'swap-horizontal', color: brandColors.leads };
      case 'property_status_changed':
        return { name: 'swap-horizontal', color: brandColors.properties };
      default:
        return { name: 'information-circle', color: colors.textMuted };
    }
  };

  const styles = createStyles(colors, insets);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/logo-login.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.greeting}>Hola, {agent?.name?.split(' ')[0]}</Text>
            <Text style={styles.subGreeting}>M&D Propiedades</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/settings')} 
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            tintColor={brandColors.primary}
            colors={[brandColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: statCardColors.clients.bg }]}
            onPress={() => router.push('/(tabs)/clients')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconContainer, { backgroundColor: statCardColors.clients.text }]}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: statCardColors.clients.text }]}>
              {stats?.total_clients || 0}
            </Text>
            <Text style={[styles.statLabel, { color: statCardColors.clients.text }]}>Clientes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: statCardColors.leads.bg }]}
            onPress={() => router.push('/(tabs)/leads')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconContainer, { backgroundColor: statCardColors.leads.text }]}>
              <Ionicons name="star" size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: statCardColors.leads.text }]}>
              {stats?.total_leads || 0}
            </Text>
            <Text style={[styles.statLabel, { color: statCardColors.leads.text }]}>Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: statCardColors.properties.bg }]}
            onPress={() => router.push('/(tabs)/properties')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconContainer, { backgroundColor: statCardColors.properties.text }]}>
              <Ionicons name="home" size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: statCardColors.properties.text }]}>
              {stats?.total_properties || 0}
            </Text>
            <Text style={[styles.statLabel, { color: statCardColors.properties.text }]}>Propiedades</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: statCardColors.calendar.bg }]}
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconContainer, { backgroundColor: statCardColors.calendar.text }]}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: statCardColors.calendar.text }]}>
              {stats?.upcoming_appointments || 0}
            </Text>
            <Text style={[styles.statLabel, { color: statCardColors.calendar.text }]}>Citas</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsScrollContent}
          >
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/client/add')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: statCardColors.clients.bg }]}>
                <Ionicons name="person-add" size={24} color={statCardColors.clients.text} />
              </View>
              <Text style={styles.actionText}>Nuevo{'\n'}Cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/lead/add')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: statCardColors.leads.bg }]}>
                <Ionicons name="star" size={24} color={statCardColors.leads.text} />
              </View>
              <Text style={styles.actionText}>Nuevo{'\n'}Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/property/add')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: statCardColors.properties.bg }]}>
                <Ionicons name="home" size={24} color={statCardColors.properties.text} />
              </View>
              <Text style={styles.actionText}>Nueva{'\n'}Propiedad</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/appointment/add')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: statCardColors.calendar.bg }]}>
                <Ionicons name="calendar" size={24} color={statCardColors.calendar.text} />
              </View>
              <Text style={styles.actionText}>Nueva{'\n'}Cita</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Buyer Reserve Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.buyerReserveCard, { backgroundColor: statCardColors.buyerReserve.bg }]}
            onPress={() => router.push('/buyer-reserve')}
            activeOpacity={0.8}
          >
            <View style={[styles.buyerReserveIcon, { backgroundColor: statCardColors.buyerReserve.text }]}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
            <View style={styles.buyerReserveContent}>
              <Text style={styles.buyerReserveTitle}>Compradores en Reserva</Text>
              <Text style={styles.buyerReserveDescription}>
                Gestiona compradores con presupuesto disponible
              </Text>
            </View>
            <View style={styles.buyerReserveArrow}>
              <Ionicons name="chevron-forward" size={20} color={statCardColors.buyerReserve.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay actividades recientes</Text>
              <Text style={styles.emptySubtext}>
                Las actividades aparecerán aquí cuando agregues clientes, leads o propiedades
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {activities.slice(0, 5).map((activity, index) => {
                const icon = getActivityIcon(activity.type);
                return (
                  <View 
                    key={activity.id} 
                    style={[
                      styles.activityItem,
                      index === activities.slice(0, 5).length - 1 && styles.activityItemLast
                    ]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name as any} size={18} color={icon.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityDescription} numberOfLines={2}>
                        {activity.description}
                      </Text>
                      <Text style={styles.activityTime}>
                        {format(new Date(activity.timestamp), "d 'de' MMMM, HH:mm", { locale: es })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    greeting: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.text,
    },
    subGreeting: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: spacing.xl,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: spacing.md,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      minWidth: '47%',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      ...shadows.sm,
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: 32,
    },
    statLabel: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    section: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
      marginBottom: spacing.md,
    },
    actionsScrollContent: {
      gap: spacing.sm,
    },
    actionButton: {
      alignItems: 'center',
      width: 80,
    },
    actionIcon: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    actionText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    buyerReserveCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buyerReserveIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    buyerReserveContent: {
      flex: 1,
    },
    buyerReserveTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    buyerReserveDescription: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    buyerReserveArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityList: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    activityItem: {
      flexDirection: 'row',
      paddingBottom: spacing.md,
      marginBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    activityItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    activityContent: {
      flex: 1,
    },
    activityDescription: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    activityTime: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      ...shadows.sm,
    },
    emptyText: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    emptySubtext: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 20,
    },
  });
