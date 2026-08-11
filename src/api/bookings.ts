import { http } from './http';
import type { AdminBooking } from '../types';

export const getBookings = () => http.get<AdminBooking[]>('/admin/bookings');
export const getBooking = (id: string) => http.get<AdminBooking>(`/admin/bookings/${id}`);
export const cancelBooking = (id: string) => http.post<AdminBooking>(`/admin/bookings/${id}/cancel`);
