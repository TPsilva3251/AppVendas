
export interface User {
  id: string;
  username: string;
  name: string;
  password?: string; // Usado apenas no registro via "terminal" (código)
  isActive: boolean; // Controla se o usuário pode acessar o sistema
}

export interface Client {
  id: string;
  userId: string; // Isolamento por usuário
  code?: number;
  name: string;
  cnpj?: string;
  email?: string;
  phone: string;
  address: string;
  company: string;
  category: 'A' | 'B' | 'C';
  assignedRoute?: string;
  lastVisitDate?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface Appointment {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  purpose: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Sale {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface SavedRoute {
  id: string;
  userId: string;
  name: string;
  clientIds: string[];
  optimization?: string;
  date?: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  CLIENTS = 'clients',
  AGENDA = 'agenda',
  ROUTES = 'routes',
  AI = 'ai'
}
