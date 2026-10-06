import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as apiLogin, verifyMfa as apiVerifyMfa, type AuthRole } from './api/auth';
import { clearToken, getToken, registerUnauthorizedHandler, setToken } from './api/token';

interface AdminSession {
  role: 'ADMIN';
  name: string;
  email: string;
}

interface OrganizerSession {
  role: 'ORGANIZER';
  name: string;
  email: string;
}

export type Session = AdminSession | OrganizerSession;
export type Role = Session['role'];

/** Returned by `login()` while the user is between "password accepted" and "TOTP code entered" —
 * the back-office shows a code-entry screen for this instead of a session until `completeMfa`
 * (or `cancelMfa`) resolves it. */
export interface PendingMfa {
  challengeToken: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  session: Session | null;
  pendingMfa: PendingMfa | null;
  loading: boolean;
  error: string | null;
  /** Single login call for both ADMIN and ORGANIZER — the role is resolved server-side from the
   * email, there is no role picker in the UI anymore. */
  login: (email: string, password: string) => Promise<void>;
  completeMfa: (code: string) => Promise<void>;
  cancelMfa: () => void;
  logout: () => void;
}

const SESSION_KEY = 'eticket-back-office.session';

const AuthContext = createContext<AuthContextValue | null>(null);

function isValidSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (v.role === 'ADMIN' || v.role === 'ORGANIZER') && typeof v.name === 'string' && typeof v.email === 'string';
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSession(parsed)) {
      // Malformed or pre-role-discriminant session (or a tampered one): never leave a token
      // sitting in storage with no matching session — that's an authenticated-but-logged-out
      // state. Clear both so the user cleanly falls back to the login screen.
      clearToken();
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // localStorage indisponible — la session ne survivra pas au rechargement.
  }
}

function sessionFromRole(role: AuthRole, name: string, email: string): Session {
  return role === 'ADMIN' ? { role: 'ADMIN', name, email } : { role: 'ORGANIZER', name, email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => (getToken() ? readStoredSession() : null));
  const [pendingMfa, setPendingMfa] = useState<PendingMfa | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearToken();
      writeStoredSession(null);
      setSession(null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(email, password);
      if (res.mfaRequired) {
        setPendingMfa({ challengeToken: res.token, name: res.name, email: res.email });
        return;
      }
      setToken(res.token);
      const next = sessionFromRole(res.role as AuthRole, res.name, res.email);
      writeStoredSession(next);
      setSession(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de connexion');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const completeMfa = async (code: string) => {
    if (!pendingMfa) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiVerifyMfa(pendingMfa.challengeToken, code);
      setToken(res.token);
      const next = sessionFromRole(res.role as AuthRole, res.name, res.email);
      writeStoredSession(next);
      setSession(next);
      setPendingMfa(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = () => {
    setPendingMfa(null);
    setError(null);
  };

  const logout = () => {
    clearToken();
    writeStoredSession(null);
    setSession(null);
    setPendingMfa(null);
  };

  const value = useMemo(
    () => ({ session, pendingMfa, loading, error, login, completeMfa, cancelMfa, logout }),
    [session, pendingMfa, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
