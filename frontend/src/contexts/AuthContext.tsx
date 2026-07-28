import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent, AuthResponse } from '../types';
import { authAPI } from '../api/client';

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
    profile_photo?: string;
    current_password?: string;
    new_password?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedAgent = await AsyncStorage.getItem('agent_data');
      
      if (storedToken && storedAgent) {
        setToken(storedToken);
        setAgent(JSON.parse(storedAgent));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authAPI.login(email, password);
      
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('agent_data', JSON.stringify(response.agent));
      
      setToken(response.access_token);
      setAgent(response.agent);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const response: AuthResponse = await authAPI.register(name, email, phone, password);
      
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('agent_data', JSON.stringify(response.agent));
      
      setToken(response.access_token);
      setAgent(response.agent);
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.detail || 'Error al registrarse');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('agent_data');
      setToken(null);
      setAgent(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: {
    name?: string;
    phone?: string;
    profile_photo?: string;
    current_password?: string;
    new_password?: string;
  }) => {
    try {
      const updated = await authAPI.updateProfile(data);
      await AsyncStorage.setItem('agent_data', JSON.stringify(updated));
      setAgent(updated);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar el perfil');
    }
  };

  return (
    <AuthContext.Provider value={{ agent, token, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};