const TOKEN_KEY = 'eticket-back-office.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  unauthorizedHandled = false;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage indisponible (mode privé, etc.) — la session ne survivra pas au rechargement.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // idem
  }
}

/** Set by App on mount so http.ts can force a logout on 401 without a circular import on AuthContext. */
let onUnauthorized: (() => void) | null = null;
let unauthorizedHandled = false;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
  unauthorizedHandled = false;
}

/** Only the first 401 in a batch of parallel requests actually triggers the logout — the rest are no-ops. */
export function notifyUnauthorized(): void {
  if (unauthorizedHandled) return;
  unauthorizedHandled = true;
  onUnauthorized?.();
}
