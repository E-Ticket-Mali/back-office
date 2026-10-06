import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminLogin, organizerLogin } from './api/auth';
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

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  loginAsOrganizer: (email: string, password: string) => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => (getToken() ? readStoredSession() : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearToken();
      writeStoredSession(null);
      setSession(null);
    });
  }, []);

  const loginAsAdmin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(email, password);
      setToken(res.token);
      const next: Session = { role: 'ADMIN', name: res.name, email: res.email };
      writeStoredSession(next);
      setSession(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de connexion');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loginAsOrganizer = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await organizerLogin(email, password);
      setToken(res.token);
      const next: Session = { role: 'ORGANIZER', name: res.name, email: res.email };
      writeStoredSession(next);
      setSession(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de connexion');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    writeStoredSession(null);
    setSession(null);
  };

  const value = useMemo(
    () => ({ session, loading, error, loginAsAdmin, loginAsOrganizer, logout }),
    [session, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
