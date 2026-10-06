import { http } from './http';
import type { AssignedEvent, OrganizerStaffAgent } from '../types';

export interface OrganizerStaffInput {
  staffCode: string;
  agentName: string;
}

export const getOrganizerStaff = () => http.get<OrganizerStaffAgent[]>('/organizer/staff');
export const getOrganizerStaffMember = (id: string) => http.get<OrganizerStaffAgent>(`/organizer/staff/${id}`);
export const createOrganizerStaff = (data: OrganizerStaffInput) =>
  http.post<OrganizerStaffAgent>('/organizer/staff', data);
export const updateOrganizerStaff = (id: string, patch: { agentName: string }) =>
  http.patch<OrganizerStaffAgent>(`/organizer/staff/${id}`, patch);
export const deleteOrganizerStaff = (id: string) => http.delete(`/organizer/staff/${id}`);

export const getAssignedEvents = (staffId: string) => http.get<AssignedEvent[]>(`/organizer/staff/${staffId}/events`);
export const assignStaffToEvent = (staffId: string, eventId: string) =>
  http.post(`/organizer/staff/${staffId}/events/${eventId}`);
export const unassignStaffFromEvent = (staffId: string, eventId: string) =>
  http.delete(`/organizer/staff/${staffId}/events/${eventId}`);
