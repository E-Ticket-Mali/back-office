import { http } from './http';

export interface OrganizerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nif: string | null;
  rccm: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  commissionRate: number | null;
  createdAt: string;
}

export const getOrganizerProfile = () => http.get<OrganizerProfile>('/organizer/profile');
export const updateOrganizerProfile = (patch: { name?: string; phone?: string }) =>
  http.patch<OrganizerProfile>('/organizer/profile', patch);
export const changeOrganizerPassword = (currentPassword: string, newPassword: string) =>
  http.post<void>('/organizer/profile/password', { currentPassword, newPassword });
