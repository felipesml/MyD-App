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
import { useTheme } from '../../src/contexts/ThemeContext';
import { useRegion, CHILE_REGIONS } from '../../src/contexts/RegionContext';

export default function RegionSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { selectedRegions, toggleRegion, clearRegions, selectAllRegions } = useRegion();

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filtro de Regiones</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={styles.infoText}>
          Selecciona las regiones que deseas ver en los dropdowns de propiedades.
          Si no seleccionas ninguna, se mostrarán todas.
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={selectAllRegions}>
          <Text style={styles.actionButtonText}>Seleccionar Todas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={clearRegions}>
          <Text style={styles.actionButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.selectedCount}>
          {selectedRegions.length === 0
            ? 'Todas las regiones (sin filtro)'
            : `${selectedRegions.length} región${selectedRegions.length !== 1 ? 'es' : ''} seleccionada${selectedRegions.length !== 1 ? 's' : ''}`}
        </Text>

        <View style={styles.regionsGrid}>
          {CHILE_REGIONS.map((region) => {
            const isSelected = selectedRegions.includes(region);
            return (
              <TouchableOpacity
                key={region}
                style={[
                  styles.regionChip,
                  isSelected && styles.regionChipSelected,
                ]}
                onPress={() => toggleRegion(region)}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    isSelected && styles.regionChipTextSelected,
                  ]}
                >
                  {region}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
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
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.infoLight,
      padding: 12,
      margin: 16,
      marginBottom: 8,
      borderRadius: 8,
      gap: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.info,
      lineHeight: 18,
    },
    actionsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 8,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingTop: 8,
    },
    selectedCount: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 16,
      textAlign: 'center',
    },
    regionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    regionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    regionChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    regionChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    regionChipTextSelected: {
      color: '#fff',
    },
  });
