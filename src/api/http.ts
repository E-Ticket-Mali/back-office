import { getToken, notifyUnauthorized } from './token';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** Thrown on 401 so callers can silently bail out instead of flashing an error — the user is being logged out already. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Session expirée, veuillez vous reconnecter.');
    this.name = 'UnauthorizedError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body && body.message) || `Erreur ${res.status} sur ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request<unknown>(path, { method: 'DELETE' }),
};
