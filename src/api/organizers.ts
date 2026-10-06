import { http, UnauthorizedError } from './http';
import { getToken, notifyUnauthorized } from './token';
import type { AdminOrganizer, OrganizerStatus } from '../types';

export const getOrganizers = (status?: OrganizerStatus) =>
  http.get<AdminOrganizer[]>(`/admin/organizers${status ? `?status=${status}` : ''}`);
export const getOrganizer = (id: string) => http.get<AdminOrganizer>(`/admin/organizers/${id}`);
export const approveOrganizer = (id: string) => http.post<AdminOrganizer>(`/admin/organizers/${id}/approve`);
export const rejectOrganizer = (id: string, reason: string) =>
  http.post<AdminOrganizer>(`/admin/organizers/${id}/reject`, { reason });
export const suspendOrganizer = (id: string) => http.post<AdminOrganizer>(`/admin/organizers/${id}/suspend`);
export const reactivateOrganizer = (id: string) => http.post<AdminOrganizer>(`/admin/organizers/${id}/reactivate`);
/** `rate === null` remet l'organisateur sur le taux par défaut de la plateforme. */
export const updateCommissionRate = (id: string, rate: number | null) =>
  http.patch<AdminOrganizer>(`/admin/organizers/${id}/commission-rate`, { rate });

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

// The backend's own Content-Disposition filename is just the document's UUID with no
// extension, and it's served as the content type the organizer actually uploaded (Story 1.2
// restricts uploads to these three) — derive the extension from that instead.
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/** Document download returns the raw file bytes, not JSON — downloaded directly via fetch + blob
 * rather than through `http.get<T>()`, which always parses the response as JSON (gabarit `exportManifest`, Story 6.3). */
export async function downloadOrganizerDocument(organizerId: string, docId: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/admin/organizers/${organizerId}/documents/${docId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  // Mirror http.ts's 401 handling: an expired session must trigger the same silent logout as
  // every other API call, not a raw error banner on top of a dead session.
  if (res.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(`Erreur ${res.status} lors du téléchargement du document.`);
  }
  const contentType = res.headers.get('Content-Type')?.split(';')[0]?.trim() ?? '';
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = extension ? `${filename}.${extension}` : filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
