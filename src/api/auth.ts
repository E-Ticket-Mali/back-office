import { http } from './http';

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

export const adminLogin = (email: string, password: string) =>
  http.post<AuthResponse>('/auth/admin/login', { email, password });

export const organizerLogin = (email: string, password: string) =>
  http.post<AuthResponse>('/auth/organizer/login', { email, password });
