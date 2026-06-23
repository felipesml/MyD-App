import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '../../src/contexts/ThemeContext';

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { mode, setMode, colors } = useTheme();

  const themeOptions: { value: ThemeMode; label: string; icon: string; description: string }[] = [
    {
      value: 'light',
      label: 'Claro',
      icon: 'sunny',
      description: 'Siempre usar el tema claro',
    },
    {
      value: 'dark',
      label: 'Oscuro',
      icon: 'moon',
      description: 'Siempre usar el tema oscuro',
    },
    {
      value: 'system',
      label: 'Sistema',
      icon: 'phone-portrait-outline',
      description: 'Seguir la configuración del dispositivo',
    },
  ];

  const handleSelectTheme = async (newMode: ThemeMode) => {
    await setMode(newMode);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apariencia</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          Selecciona cómo quieres que se vea la aplicación
        </Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                mode === option.value && styles.optionCardSelected,
              ]}
              onPress={() => handleSelectTheme(option.value)}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIcon,
                    mode === option.value && styles.optionIconSelected,
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={mode === option.value ? '#fff' : colors.textMuted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      mode === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
              {mode === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    description: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 24,
      textAlign: 'center',
    },
    optionsContainer: {
      gap: 12,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionIconSelected: {
      backgroundColor: colors.primary,
    },
    optionText: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    optionDescription: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
