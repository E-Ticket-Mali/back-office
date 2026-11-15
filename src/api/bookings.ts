import { http } from './http';
import type { AdminBooking, BookingStatus, PageResponse } from '../types';

/** @deprecated Télécharge toutes les réservations : utiliser {@link searchBookings}. */
export const getBookings = () => http.get<AdminBooking[]>('/admin/bookings');
export const getBooking = (id: string) => http.get<AdminBooking>(`/admin/bookings/${id}`);

export interface BookingSearch {
  /** Page à partir de 0. */
  page?: number;
  /** 1 à 100. */
  size?: number;
  status?: BookingStatus;
  /** Texte cherché (3 caractères minimum). */
  q?: string;
  /** Réservations d'un seul client. */
  userId?: string;
}

/** Une page de réservations, filtrée et triée côté serveur (plus récentes d'abord). */
export const searchBookings = ({ page = 0, size = 20, status, q, userId }: BookingSearch = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (userId) params.set('userId', userId);
  return http.get<PageResponse<AdminBooking>>(`/admin/bookings/search?${params.toString()}`);
};
