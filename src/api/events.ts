import { http } from './http';
import type {
  AdminScanRecord,
  EventCategory,
  EventItem,
  EventStats,
  EventTicket,
  TicketManifestEntry,
  TicketType,
} from '../types';

export interface EventInput {
  category: EventCategory;
  name: string;
  location: string;
  city: string;
  date: string;
  desc: string;
  icon: string;
}

export interface TicketTypeInput {
  type: TicketType;
  price: number;
  /** Omitted = unlimited. */
  capacity?: number;
}

export const getEvents = () => http.get<EventItem[]>('/admin/events');
export const getEvent = (id: string) => http.get<EventItem>(`/admin/events/${id}`);
export const createEvent = (data: EventInput) => http.post<EventItem>('/admin/events', data);
export const updateEvent = (id: string, patch: Partial<EventInput>) => http.patch<EventItem>(`/admin/events/${id}`, patch);
export const deleteEvent = (id: string) => http.delete(`/admin/events/${id}`);

export const addTicketType = (eventId: string, data: TicketTypeInput) =>
  http.post<EventTicket>(`/admin/events/${eventId}/ticket-types`, data);
export const updateTicketType = (eventId: string, ticketTypeId: string, patch: { price?: number; capacity?: number }) =>
  http.patch<EventTicket>(`/admin/events/${eventId}/ticket-types/${ticketTypeId}`, patch);
export const deleteTicketType = (eventId: string, ticketTypeId: string) =>
  http.delete(`/admin/events/${eventId}/ticket-types/${ticketTypeId}`);

export const getEventTickets = (eventId: string) => http.get<TicketManifestEntry[]>(`/admin/events/${eventId}/tickets`);
export const getEventScanRecords = (eventId: string) =>
  http.get<AdminScanRecord[]>(`/admin/events/${eventId}/scan-records`);
export const getEventStats = (eventId: string) => http.get<EventStats>(`/admin/events/${eventId}/stats`);
