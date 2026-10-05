import { http } from './http';

export interface AdminAuthResponse {
  token: string;
  name: string;
  email: string;
}

export const adminLogin = (email: string, password: string) =>
  http.post<AdminAuthResponse>('/auth/admin/login', { email, password });

export const organizerLogin = (email: string, password: string) =>
  http.post<AdminAuthResponse>('/auth/organizer/login', { email, password });