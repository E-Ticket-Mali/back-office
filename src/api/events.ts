import { http } from './http';
import type {
  AdminScanRecord,
  EventCategory,
  EventItem,
  EventStats,
  EventTicket,
  OrganizerEventStatus,
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
  /** Tarifs fixés dès la création. */
  tickets?: TicketTypeInput[];
}

export interface TicketTypeInput {
  type: TicketType;
  price: number;
  /** Omitted = unlimited. */
  capacity?: number;
}

export const getEvents = (status?: OrganizerEventStatus) =>
  http.get<EventItem[]>(`/admin/events${status ? `?status=${status}` : ''}`);
export const getEvent = (id: string) => http.get<EventItem>(`/admin/events/${id}`);
export const createEvent = (data: EventInput) => http.post<EventItem>('/admin/events', data);
export const updateEvent = (id: string, patch: Partial<EventInput>) => http.patch<EventItem>(`/admin/events/${id}`, patch);
export const deleteEvent = (id: string) => http.delete(`/admin/events/${id}`);
export const approveEvent = (id: string) => http.post<EventItem>(`/admin/events/${id}/approve`);
export const rejectEvent = (id: string, reason: string) => http.post<EventItem>(`/admin/events/${id}/reject`, { reason });

export const addTicketType = (eventId: string, data: TicketTypeInput) =>
  http.post<EventTicket>(`/admin/events/${eventId}/ticket-types`, data);
export const updateTicketType = (eventId: string, ticketTypeId: string, patch: { price?: number; capacity?: number }) =>
  http.patch<EventTicket>(`/admin/events/${eventId}/ticket-types/${ticketTypeId}`, patch);
export const deleteTicketType = (eventId: string, ticketTypeId: string) =>
  http.delete(`/admin/events/${eventId}/ticket-types/${ticketTypeId}`);

export const uploadTicketTypeImage = (eventId: string, ticketTypeId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return http.postForm<EventTicket>(`/admin/events/${eventId}/ticket-types/${ticketTypeId}/image`, form);
};
export const setTicketTypeImagePreset = (eventId: string, ticketTypeId: string, presetKey: string) =>
  http.put<EventTicket>(`/admin/events/${eventId}/ticket-types/${ticketTypeId}/image/preset`, { presetKey });
export const clearTicketTypeImage = (eventId: string, ticketTypeId: string) =>
  http.delete(`/admin/events/${eventId}/ticket-types/${ticketTypeId}/image`);

export const uploadEventImage = (eventId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return http.postForm<EventItem>(`/admin/events/${eventId}/image`, form);
};
export const setEventImagePreset = (eventId: string, presetKey: string) =>
  http.put<EventItem>(`/admin/events/${eventId}/image/preset`, { presetKey });
export const clearEventImage = (eventId: string) => http.delete(`/admin/events/${eventId}/image`);

export const getEventTickets = (eventId: string) => http.get<TicketManifestEntry[]>(`/admin/events/${eventId}/tickets`);
export const getEventScanRecords = (eventId: string) =>
  http.get<AdminScanRecord[]>(`/admin/events/${eventId}/scan-records`);
export const getEventStats = (eventId: string) => http.get<EventStats>(`/admin/events/${eventId}/stats`);
