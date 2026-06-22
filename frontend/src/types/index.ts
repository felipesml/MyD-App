export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  agent: Agent;
}

export interface Client {
  id: string;
  agent_id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  created_at: string;
  properties_count?: number;
}

export interface Lead {
  id: string;
  agent_id: string;
  name: string;
  email?: string;
  phone: string;
  interest_type: 'compra' | 'arriendo';
  budget?: number;
  status: 'nuevo' | 'contactado' | 'visita_programada' | 'negociacion' | 'cerrado' | 'perdido';
  source: 'web' | 'referido' | 'llamada' | 'redes_sociales' | 'otro';
  notes?: string;
  created_at: string;
  last_contact_date?: string;
}

export interface Property {
  id: string;
  agent_id: string;
  client_id: string;
  client_name?: string;
  title: string;
  address: string;
  city: string;
  price: number;
  property_type: 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'oficina';
  transaction_type: 'venta' | 'arriendo';
  status: 'disponible' | 'reservada' | 'vendida' | 'arrendada';
  bedrooms?: number;
  bathrooms?: number;
  area_m2?: number;
  parking_spots?: number;
  description?: string;
  features?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  agent_id: string;
  title: string;
  description?: string;
  appointment_type: 'visita' | 'reunion' | 'llamada' | 'otro';
  related_entity?: 'client' | 'lead' | 'property';
  related_id?: string;
  related_name?: string;
  date_time: string;
  duration_minutes: number;
  status: 'programada' | 'completada' | 'cancelada';
  notes?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  agent_id: string;
  type: string;
  description: string;
  related_entity?: string;
  related_id?: string;
  timestamp: string;
}

export interface DashboardStats {
  total_clients: number;
  total_leads: number;
  total_properties: number;
  active_properties: number;
  upcoming_appointments: number;
  leads_by_status: Record<string, number>;
  properties_by_status: Record<string, number>;
}