import { http, UnauthorizedError } from './http';
import { getToken, notifyUnauthorized } from './token';
import type { EventCategory, EventTicket, OrganizerEventItem, TicketType } from '../types';

export interface OrganizerEventInput {
  category: EventCategory;
  name: string;
  location: string;
  city: string;
  date: string;
  desc: string;
  icon: string;
}

export interface OrganizerTicketTypeInput {
  type: TicketType;
  price: number;
  /** Omitted = unlimited. */
  capacity?: number;
}

export const getOrganizerEvents = () => http.get<OrganizerEventItem[]>('/organizer/events');
export const getOrganizerEvent = (id: string) => http.get<OrganizerEventItem>(`/organizer/events/${id}`);
export const createOrganizerEvent = (data: OrganizerEventInput) =>
  http.post<OrganizerEventItem>('/organizer/events', data);
export const updateOrganizerEvent = (id: string, patch: Partial<OrganizerEventInput>) =>
  http.patch<OrganizerEventItem>(`/organizer/events/${id}`, patch);
export const submitOrganizerEvent = (id: string) => http.post<OrganizerEventItem>(`/organizer/events/${id}/submit`);

export const addOrganizerTicketType = (eventId: string, data: OrganizerTicketTypeInput) =>
  http.post<EventTicket>(`/organizer/events/${eventId}/ticket-types`, data);
export const updateOrganizerTicketType = (eventId: string, ticketTypeId: string, patch: { price?: number; capacity?: number }) =>
  http.patch<EventTicket>(`/organizer/events/${eventId}/ticket-types/${ticketTypeId}`, patch);
export const deleteOrganizerTicketType = (eventId: string, ticketTypeId: string) =>
  http.delete(`/organizer/events/${eventId}/ticket-types/${ticketTypeId}`);

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** The manifest export returns a CSV file, not JSON — downloaded directly via fetch + blob
 * rather than through `http.get<T>()`, which always parses the response as JSON. */
export async function exportManifest(eventId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/organizer/events/${eventId}/manifest/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  // Mirror http.ts's 401 handling: an expired session must trigger the same silent logout as
  // every other API call, not a raw error banner on top of a dead session.
  if (res.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(`Erreur ${res.status} lors de l'export du manifeste.`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `manifeste-${eventId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
