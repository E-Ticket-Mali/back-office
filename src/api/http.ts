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
  // A 401 on the login endpoints means wrong credentials, not an expired session: surface the server message.
  if (res.status === 401 && !path.startsWith('/auth/')) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body && body.message) || `Erreur ${res.status} sur ${path}`);
  }
  if (res.status === 204) return undefined as T;
  // Some endpoints return a non-204 success status (e.g. 201 Created) with an empty body
  // (a void controller method) — res.json() on empty text throws, so check for that first
  // instead of assuming every non-204 success response carries a JSON payload.
  const text = await res.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request<unknown>(path, { method: 'DELETE' }),
};
