import axios from 'axios';
import { Agent, AuthResponse, Client, Lead, Property, Appointment, Activity, DashboardStats, BuyerReserve } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (name: string, email: string, phone: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', { name, email, phone, password });
    return response.data;
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  getMe: async (): Promise<Agent> => {
    const response = await apiClient.get<Agent>('/auth/me');
    return response.data;
  },
};

// Clients API
export const clientsAPI = {
  getAll: async (): Promise<Client[]> => {
    const response = await apiClient.get<Client[]>('/clients');
    return response.data;
  },
  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get<Client>(`/clients/${id}`);
    return response.data;
  },
  create: async (data: Omit<Client, 'id' | 'agent_id' | 'created_at' | 'properties_count'>): Promise<Client> => {
    const response = await apiClient.post<Client>('/clients', data);
    return response.data;
  },
  update: async (id: string, data: Omit<Client, 'id' | 'agent_id' | 'created_at' | 'properties_count'>): Promise<Client> => {
    const response = await apiClient.put<Client>(`/clients/${id}`, data);
    return response.data;
  },
  delete: async (id: string, cascade: boolean = false): Promise<void> => {
    await apiClient.delete(`/clients/${id}`, { params: { cascade } });
  },
};

// Leads API
export const leadsAPI = {
  getAll: async (): Promise<Lead[]> => {
    const response = await apiClient.get<Lead[]>('/leads');
    return response.data;
  },
  getById: async (id: string): Promise<Lead> => {
    const response = await apiClient.get<Lead>(`/leads/${id}`);
    return response.data;
  },
  create: async (data: Omit<Lead, 'id' | 'agent_id' | 'created_at' | 'last_contact_date'>): Promise<Lead> => {
    const response = await apiClient.post<Lead>('/leads', data);
    return response.data;
  },
  update: async (id: string, data: Omit<Lead, 'id' | 'agent_id' | 'created_at' | 'last_contact_date'>): Promise<Lead> => {
    const response = await apiClient.put<Lead>(`/leads/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },
};

// Properties API
export const propertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    const response = await apiClient.get<Property[]>('/properties');
    return response.data;
  },
  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },
  getByClient: async (clientId: string): Promise<Property[]> => {
    const response = await apiClient.get<Property[]>(`/properties/client/${clientId}`);
    return response.data;
  },
  create: async (data: Omit<Property, 'id' | 'agent_id' | 'created_at' | 'updated_at' | 'client_name'>): Promise<Property> => {
    const response = await apiClient.post<Property>('/properties', data);
    return response.data;
  },
  update: async (id: string, data: Omit<Property, 'id' | 'agent_id' | 'created_at' | 'updated_at' | 'client_name'>): Promise<Property> => {
    const response = await apiClient.put<Property>(`/properties/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments');
    return response.data;
  },
  getUpcoming: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments/upcoming');
    return response.data;
  },
  getById: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },
  create: async (data: Omit<Appointment, 'id' | 'agent_id' | 'status' | 'created_at' | 'related_name'>): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  },
  update: async (id: string, data: Omit<Appointment, 'id' | 'agent_id' | 'status' | 'created_at' | 'related_name'>): Promise<Appointment> => {
    const response = await apiClient.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: string, status: string): Promise<void> => {
    await apiClient.put(`/appointments/${id}/status`, null, { params: { status } });
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },
};

// Activities API
export const activitiesAPI = {
  getAll: async (limit: number = 50): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>('/activities', { params: { limit } });
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};

// Buyer Reserves API
export const buyerReservesAPI = {
  getAll: async (): Promise<BuyerReserve[]> => {
    const response = await apiClient.get<BuyerReserve[]>('/buyer-reserves');
    return response.data;
  },
  getById: async (id: string): Promise<BuyerReserve> => {
    const response = await apiClient.get<BuyerReserve>(`/buyer-reserves/${id}`);
    return response.data;
  },
  create: async (data: Omit<BuyerReserve, 'id' | 'agent_id' | 'created_at'>): Promise<BuyerReserve> => {
    const response = await apiClient.post<BuyerReserve>('/buyer-reserves', data);
    return response.data;
  },
  update: async (id: string, data: Omit<BuyerReserve, 'id' | 'agent_id' | 'created_at'>): Promise<BuyerReserve> => {
    const response = await apiClient.put<BuyerReserve>(`/buyer-reserves/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/buyer-reserves/${id}`);
  },
};

export default apiClient;