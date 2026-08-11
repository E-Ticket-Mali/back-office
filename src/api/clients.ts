import { http } from './http';
import type { AdminClient } from '../types';

export const getClients = () => http.get<AdminClient[]>('/admin/clients');
export const getClient = (id: string) => http.get<AdminClient>(`/admin/clients/${id}`);
