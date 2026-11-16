import { http } from './http';
import type { AdminClient, PageResponse } from '../types';

/** @deprecated Télécharge tous les clients : utiliser {@link searchClients}. */
export const getClients = () => http.get<AdminClient[]>('/admin/clients');
export const getClient = (id: string) => http.get<AdminClient>(`/admin/clients/${id}`);

/** Une page de clients (plus récents d'abord), recherche par nom, téléphone ou e-mail (3 caractères minimum). */
export const searchClients = ({ page = 0, size = 20, q }: { page?: number; size?: number; q?: string } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (q) params.set('q', q);
  return http.get<PageResponse<AdminClient>>(`/admin/clients/search?${params.toString()}`);
};
