import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fonts, brandColors, spacing, borderRadius } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo-login.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>M&D Propiedades</Text>
          <Text style={styles.brandText}>CRM</Text>
          <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="mail" size={20} color={brandColors.primary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed" size={20} color={brandColors.primary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color={colors.textMuted} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.link}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Versión 1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
      paddingTop: insets.top + spacing.xl,
      paddingBottom: insets.bottom + spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: spacing.md,
    },
    title: {
      fontWeight: '700',
      fontSize: 28,
      color: colors.text,
      textAlign: 'center',
    },
    brandText: {
      fontWeight: '700',
      fontSize: 18,
      color: brandColors.primary,
      marginTop: 4,
    },
    subtitle: {
      fontWeight: '400',
      fontSize: 15,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    inputIconContainer: {
      width: 52,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    input: {
      flex: 1,
      height: 56,
      paddingHorizontal: spacing.md,
      fontWeight: '400',
      fontSize: 16,
      color: colors.text,
    },
    eyeButton: {
      padding: spacing.md,
    },
    button: {
      backgroundColor: brandColors.primary,
      borderRadius: borderRadius.md,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonDisabled: {
      backgroundColor: brandColors.primary + '80',
    },
    buttonText: {
      fontWeight: '600',
      color: '#fff',
      fontSize: 16,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontWeight: '400',
      fontSize: 14,
      color: colors.textMuted,
      paddingHorizontal: spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerText: {
      fontWeight: '400',
      fontSize: 14,
      color: colors.textMuted,
    },
    link: {
      fontWeight: '600',
      fontSize: 14,
      color: brandColors.primary,
    },
    versionText: {
      fontWeight: '400',
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
