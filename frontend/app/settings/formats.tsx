import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { usePreferences } from '../../src/contexts/PreferencesContext';

export default function FormatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { dateFormat, timeFormat, setDateFormat, setTimeFormat } = usePreferences();
  const styles = createStyles(colors);

  const Option = ({
    active,
    label,
    sublabel,
    onPress,
  }: {
    active: boolean;
    label: string;
    sublabel: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
        <Text style={styles.optionSub}>{sublabel}</Text>
      </View>
      {active && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formato de Fecha y Hora</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Formato de Fecha</Text>
        <Option
          active={dateFormat === 'ymd'}
          label="AÑO-MES-DÍA"
          sublabel="Ej: 2026-06-28"
          onPress={() => setDateFormat('ymd')}
        />
        <Option
          active={dateFormat === 'dmy'}
          label="DÍA-MES-AÑO"
          sublabel="Ej: 28-06-2026"
          onPress={() => setDateFormat('dmy')}
        />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Formato de Hora</Text>
        <Option
          active={timeFormat === '12h'}
          label="AM / PM"
          sublabel="Ej: 03:30 PM"
          onPress={() => setTimeFormat('12h')}
        />
        <Option
          active={timeFormat === '24h'}
          label="24 HRS"
          sublabel="Ej: 15:30"
          onPress={() => setTimeFormat('24h')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 16 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
      marginLeft: 4,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionActive: { borderColor: colors.primary },
    optionLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    optionLabelActive: { color: colors.primary },
    optionSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  });
