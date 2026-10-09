import { http } from './http';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
  createdAt: string | null;
}

/** Règles appliquées par le serveur (lecture seule) ; taux en pourcentage. */
export interface PlatformSettings {
  defaultCommissionRate: number;
  serviceFeeRate: number;
  sessionMinutes: number;
  maxDocumentSizeMb: number;
  maxImageSizeMb: number;
}

export const getAdminProfile = () => http.get<AdminProfile>('/admin/profile');
export const updateAdminProfile = (name: string) => http.patch<AdminProfile>('/admin/profile', { name });
export const changeAdminPassword = (currentPassword: string, newPassword: string) =>
  http.post<void>('/admin/profile/password', { currentPassword, newPassword });
export const getPlatformSettings = () => http.get<PlatformSettings>('/admin/settings/platform');
