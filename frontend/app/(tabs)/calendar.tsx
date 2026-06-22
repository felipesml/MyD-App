import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { appointmentsAPI } from '../../src/api/client';
import { Appointment } from '../../src/types';
import { format, isSameDay, parseISO } from 'date-fns';

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

export default function CalendarScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadAppointments();
  }, []);

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
      selectedColor: '#3b82f6',
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

  const selectedDateAppointments = getAppointmentsForSelectedDate();

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
        <Text style={styles.headerTitle}>Calendario</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/appointment/add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              todayTextColor: '#3b82f6',
              selectedDayBackgroundColor: '#3b82f6',
              selectedDayTextColor: '#ffffff',
              arrowColor: '#3b82f6',
              monthTextColor: '#111827',
              textMonthFontWeight: 'bold',
              textMonthFontSize: 16,
            }}
          />
        </View>

        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>
            Citas del {format(parseISO(selectedDate), 'd/MM/yyyy')}
          </Text>

          {selectedDateAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No hay citas programadas para este día</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/appointment/add')}
              >
                <Text style={styles.emptyButtonText}>Agregar cita</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.appointmentsList}>
              {selectedDateAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push(`/appointment/${appointment.id}`)}
                >
                  <View
                    style={[
                      styles.appointmentIcon,
                      { backgroundColor: TYPE_COLORS[appointment.appointment_type] + '20' },
                    ]}
                  >
                    <Ionicons
                      name={TYPE_ICONS[appointment.appointment_type] as any}
                      size={24}
                      color={TYPE_COLORS[appointment.appointment_type]}
                    />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                    {appointment.related_name && (
                      <Text style={styles.appointmentRelated}>{appointment.related_name}</Text>
                    )}
                    <View style={styles.appointmentTime}>
                      <Ionicons name="time" size={12} color="#6b7280" />
                      <Text style={styles.appointmentTimeText}>
                        {format(parseISO(appointment.date_time), 'HH:mm')} -{' '}
                        {appointment.duration_minutes} min
                      </Text>
                    </View>
                  </View>
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
                </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appointmentsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  appointmentRelated: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
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
