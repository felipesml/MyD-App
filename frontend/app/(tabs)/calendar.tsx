import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appointmentsAPI } from '../../src/api/client';
import { Appointment } from '../../src/types';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../src/contexts/ThemeContext';
import { usePreferences } from '../../src/contexts/PreferencesContext';
import { fonts, brandColors, spacing, borderRadius, shadows } from '../../src/theme';

// Configure Spanish locale for calendar
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const TYPE_ICONS: Record<string, string> = {
  visita: 'home',
  reunion: 'people',
  llamada: 'call',
  otro: 'calendar',
};

const TYPE_COLORS: Record<string, string> = {
  visita: '#10b981',
  reunion: '#3b82f6',
  llamada: '#f59e0b',
  otro: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  visita: 'Visita',
  reunion: 'Reunión',
  llamada: 'Llamada',
  otro: 'Otro',
};

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { formatTime } = usePreferences();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [])
  );

  useEffect(() => {
    updateMarkedDates();
  }, [appointments, selectedDate]);

  const loadAppointments = async () => {
    try {
      const data = await appointmentsAPI.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateMarkedDates = () => {
    const marked: any = {};

    // Mark dates with appointments
    appointments.forEach((appointment) => {
      const date = appointment.date_time.split('T')[0];
      if (!marked[date]) {
        marked[date] = {
          marked: true,
          dots: [],
        };
      }
      marked[date].dots.push({
        key: appointment.id,
        color: TYPE_COLORS[appointment.appointment_type],
      });
    });

    // Mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: brandColors.calendar,
    };

    setMarkedDates(marked);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAppointments();
  };

  const getAppointmentsForSelectedDate = () => {
    return appointments
      .filter((appointment) => {
        const appointmentDate = parseISO(appointment.date_time);
        const selected = parseISO(selectedDate);
        return isSameDay(appointmentDate, selected);
      })
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  };

  const styles = createStyles(colors, insets);
  const selectedDateAppointments = getAppointmentsForSelectedDate();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={brandColors.calendar} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerSubtitle}>{appointments.length} citas programadas</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/appointment/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            tintColor={brandColors.calendar}
            colors={[brandColors.calendar]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textMuted,
              selectedDayBackgroundColor: brandColors.calendar,
              selectedDayTextColor: '#ffffff',
              todayTextColor: brandColors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: brandColors.calendar,
              selectedDotColor: '#ffffff',
              arrowColor: brandColors.calendar,
              monthTextColor: colors.text,
              indicatorColor: brandColors.calendar,
              textDayFontFamily: fonts.regular,
              textMonthFontFamily: fonts.bold,
              textDayHeaderFontFamily: fonts.medium,
              textMonthFontSize: 18,
              textDayFontSize: 15,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })}
            </Text>
            <Text style={styles.sectionCount}>
              {selectedDateAppointments.length} {selectedDateAppointments.length === 1 ? 'cita' : 'citas'}
            </Text>
          </View>

          {selectedDateAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={40} color={brandColors.calendar} />
              </View>
              <Text style={styles.emptyTitle}>Sin citas</Text>
              <Text style={styles.emptyText}>No hay citas programadas para este día</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/appointment/add')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Agregar Cita</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.appointmentsList}>
              {selectedDateAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push(`/appointment/${appointment.id}`)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.appointmentIcon,
                      { backgroundColor: TYPE_COLORS[appointment.appointment_type] + '20' },
                    ]}
                  >
                    <Ionicons
                      name={TYPE_ICONS[appointment.appointment_type] as any}
                      size={22}
                      color={TYPE_COLORS[appointment.appointment_type]}
                    />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentTitleRow}>
                      <Text style={styles.appointmentTitle} numberOfLines={1}>
                        {appointment.title}
                      </Text>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: TYPE_COLORS[appointment.appointment_type] + '20' }
                      ]}>
                        <Text style={[
                          styles.typeBadgeText,
                          { color: TYPE_COLORS[appointment.appointment_type] }
                        ]}>
                          {TYPE_LABELS[appointment.appointment_type]}
                        </Text>
                      </View>
                    </View>
                    {appointment.related_name && (
                      <Text style={styles.appointmentRelated} numberOfLines={1}>
                        <Ionicons name="person" size={12} color={colors.textMuted} /> {appointment.related_name}
                      </Text>
                    )}
                    <View style={styles.appointmentMeta}>
                      <View style={styles.appointmentTime}>
                        <Ionicons name="time-outline" size={14} color={brandColors.calendar} />
                        <Text style={styles.appointmentTimeText}>
                          {formatTime(parseISO(appointment.date_time))}
                        </Text>
                      </View>
                      <View style={styles.appointmentDuration}>
                        <Ionicons name="hourglass-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.appointmentDurationText}>
                          {appointment.duration_minutes} min
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              appointment.status === 'programada'
                                ? '#10b98120'
                                : appointment.status === 'completada'
                                ? '#3b82f620'
                                : '#ef444420',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                appointment.status === 'programada'
                                  ? '#10b981'
                                  : appointment.status === 'completada'
                                  ? '#3b82f6'
                                  : '#ef4444',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                appointment.status === 'programada'
                                  ? '#10b981'
                                  : appointment.status === 'completada'
                                  ? '#3b82f6'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {appointment.status === 'programada' 
                            ? 'Programada' 
                            : appointment.status === 'completada'
                            ? 'Completada'
                            : 'Cancelada'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
      backgroundColor: brandColors.calendar,
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.md,
    },
    content: {
      flex: 1,
    },
    calendarContainer: {
      backgroundColor: colors.surface,
      margin: spacing.md,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...shadows.sm,
    },
    calendar: {
      borderRadius: borderRadius.lg,
    },
    appointmentsSection: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontWeight: '700',
      fontSize: 18,
      color: colors.text,
    },
    sectionCount: {
      fontWeight: '500',
      fontSize: 14,
      color: colors.textMuted,
    },
    appointmentsList: {
      gap: spacing.sm,
    },
    appointmentCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
    },
    appointmentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    appointmentInfo: {
      flex: 1,
    },
    appointmentTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    appointmentTitle: {
      fontWeight: '600',
      fontSize: 16,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    typeBadgeText: {
      fontWeight: '500',
      fontSize: 11,
    },
    appointmentRelated: {
      fontWeight: '400',
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    appointmentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    appointmentTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    appointmentTimeText: {
      fontWeight: '600',
      fontSize: 14,
      color: brandColors.calendar,
    },
    appointmentDuration: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    appointmentDurationText: {
      fontWeight: '400',
      fontSize: 13,
      color: colors.textMuted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontWeight: '500',
      fontSize: 11,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      ...shadows.sm,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: brandColors.calendarLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontWeight: '700',
      fontSize: 18,
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
      backgroundColor: brandColors.calendar,
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
