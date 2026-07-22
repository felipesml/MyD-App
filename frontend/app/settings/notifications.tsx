import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationContext';

const REMINDER_TIMES = [
  { value: 5, label: '5 minutos' },
  { value: 10, label: '10 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
];

const REMINDER_COUNTS = [
  { value: 1, label: '1 recordatorio' },
  { value: 2, label: '2 recordatorios' },
  { value: 3, label: '3 recordatorios' },
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, updateSettings, requestPermissions, hasPermission } = useNotifications();

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permisos Requeridos',
          'Necesitas habilitar los permisos de notificaciones en la configuración de tu dispositivo.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    await updateSettings({ enabled });
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Enable/Disable */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="notifications" size={24} color={colors.primary} />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Recordatorios de Citas</Text>
                <Text style={styles.toggleDescription}>
                  Recibe notificaciones antes de tus citas
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={settings.enabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* Reminder Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tiempo de Anticipación</Text>
              <Text style={styles.sectionDescription}>
                ¿Cuánto tiempo antes de la cita quieres recibir el recordatorio?
              </Text>
              <View style={styles.optionsGrid}>
                {REMINDER_TIMES.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      settings.reminderTime === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => updateSettings({ reminderTime: option.value })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        settings.reminderTime === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reminder Count */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cantidad de Recordatorios</Text>
              <Text style={styles.sectionDescription}>
                ¿Cuántos recordatorios quieres recibir? Se enviarán en intervalos del tiempo seleccionado.
              </Text>
              <View style={styles.optionsGrid}>
                {REMINDER_COUNTS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      settings.reminderCount === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => updateSettings({ reminderCount: option.value })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        settings.reminderCount === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Example */}
            <View style={styles.exampleCard}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.exampleText}>
                Ejemplo: Para una cita a las 15:00, recibirás{' '}
                {settings.reminderCount === 1
                  ? `1 recordatorio a las ${formatExampleTime(settings.reminderTime)}`
                  : settings.reminderCount === 2
                  ? `recordatorios a las ${formatExampleTime(settings.reminderTime * 2)} y ${formatExampleTime(settings.reminderTime)}`
                  : `recordatorios a las ${formatExampleTime(settings.reminderTime * 3)}, ${formatExampleTime(settings.reminderTime * 2)} y ${formatExampleTime(settings.reminderTime)}`}
              </Text>
            </View>
          </>
        )}

        {!hasPermission && settings.enabled && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              Los permisos de notificaciones no están habilitados. Actívalos en la configuración de tu dispositivo.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const formatExampleTime = (minutesBefore: number): string => {
  const hours = Math.floor((15 * 60 - minutesBefore) / 60);
  const minutes = (15 * 60 - minutesBefore) % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerPlaceholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
    },
    toggleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    toggleText: {
      flex: 1,
    },
    toggleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    toggleDescription: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    optionTextActive: {
      color: '#fff',
    },
    exampleCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.infoLight,
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    exampleText: {
      flex: 1,
      fontSize: 13,
      color: colors.info,
      lineHeight: 20,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#fef3c7',
      padding: 12,
      borderRadius: 8,
      gap: 8,
      marginTop: 16,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: '#92400e',
      lineHeight: 20,
    },
  });
