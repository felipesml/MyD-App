import { StyleSheet } from 'react-native';
import { fonts, typography } from './fonts';

// M&D Propiedades Brand Colors
export const brandColors = {
  // Primary - M&D Red
  primary: '#dc2626',
  primaryDark: '#b91c1c',
  primaryLight: '#fee2e2',
  
  // Secondary - Dark Gray
  secondary: '#1f2937',
  secondaryLight: '#374151',
  
  // Accent colors for different sections
  clients: '#3b82f6',      // Blue
  clientsLight: '#dbeafe',
  
  leads: '#f59e0b',        // Amber
  leadsLight: '#fef3c7',
  
  properties: '#10b981',   // Green
  propertiesLight: '#d1fae5',
  
  calendar: '#8b5cf6',     // Purple
  calendarLight: '#ede9fe',
  
  buyerReserve: '#14b8a6', // Teal
  buyerReserveLight: '#ccfbf1',
};

// Spacing system (8pt grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Common component styles
export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Cards
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  
  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  
  // Buttons
  buttonPrimary: {
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  
  // Chips/Tags
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  
  // Divider
  divider: {
    height: 1,
    width: '100%',
  },
});

export { fonts, typography };
