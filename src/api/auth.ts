import { http } from './http';

export type AuthRole = 'ADMIN' | 'ORGANIZER';

export interface LoginResponse {
  token: string;
  role: AuthRole | null;
  mfaRequired: boolean;
  name: string;
  email: string;
}

/** Single login entry point — the server resolves ADMIN vs ORGANIZER from the email, the client
 * never declares a role. When `mfaRequired` is true, `token` is a short-lived challenge token:
 * call `verifyMfa` with it next, not the regular API. */
export const login = (email: string, password: string) =>
  http.post<LoginResponse>('/auth/login', { email, password });

export const verifyMfa = (challengeToken: string, code: string) =>
  http.post<LoginResponse>('/auth/mfa/verify', { challengeToken, code });

export interface MfaSetupResponse {
  secret: string;
  otpauthUri: string;
}

export const setupMfa = () => http.post<MfaSetupResponse>('/auth/admin/mfa/setup', {});

export const confirmMfa = (code: string) => http.post<void>('/auth/admin/mfa/confirm', { code });

export const disableMfa = (code: string) => http.post<void>('/auth/admin/mfa/disable', { code });

export const getMfaStatus = () => http.get<{ enabled: boolean }>('/auth/admin/mfa/status');
