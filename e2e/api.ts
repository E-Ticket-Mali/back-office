/** Accès direct à l'API pour préparer les données des tests (arrange), l'UI servant à l'act/assert. */

// 127.0.0.1 plutôt que localhost : sous Windows, Node tente d'abord ::1 et la connexion peut caler.
export const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:5000/api/v1';

/** Compte admin de démo seedé par le backend (application.yml : DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD). */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@eticket.ml',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123',
};

async function call<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const isForm = rest.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isForm || !rest.body ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await call<{ token: string; mfaRequired: boolean }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.mfaRequired) throw new Error(`Le compte ${email} a la MFA activée : impossible à utiliser en E2E.`);
  return res.token;
}

export interface TestOrganizer {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;
}

/** Inscrit un organisateur unique (email horodaté) puis le fait approuver par l'admin. */
export async function createApprovedOrganizer(adminToken: string, label = 'E2E'): Promise<TestOrganizer> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const name = `${label} Orga ${stamp}`;
  const email = `e2e.orga.${stamp}@example.test`;
  const password = `E2e-${stamp}-pw`;

  const form = new FormData();
  form.append('name', name);
  form.append('email', email);
  form.append('password', password);
  form.append('phone', `+2237${stamp.slice(-7)}`);
  form.append('nif', `NIF${stamp.slice(-8)}`);
  form.append('rccm', `RCCM${stamp.slice(-8)}`);
  form.append('documentKind', 'NIF');
  form.append('document', new Blob(['%PDF-1.4\n%e2e\n'], { type: 'application/pdf' }), 'nif.pdf');
  await call('/auth/organizer/register', { method: 'POST', body: form });

  const pending = await call<{ id: string; email: string }[]>('/admin/organizers?status=PENDING', { token: adminToken });
  const created = pending.find((o) => o.email === email);
  if (!created) throw new Error(`Organisateur ${email} introuvable après inscription`);
  await call(`/admin/organizers/${created.id}/approve`, { method: 'POST', token: adminToken });

  return { id: created.id, name, email, password, token: await login(email, password) };
}

export interface TestEvent {
  id: string;
  name: string;
}

/** Crée un événement (brouillon) avec un tarif ; `submit`/`approve` pour avancer dans le workflow. */
export async function createOrganizerEvent(
  organizer: TestOrganizer,
  opts: { name?: string; submit?: boolean; approveWith?: string; publish?: boolean; capacity?: number } = {},
): Promise<TestEvent> {
  const name = opts.name ?? `E2E Concert ${Date.now()}`;
  const date = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 19) + 'Z';
  const event = await call<{ id: string }>('/organizer/events', {
    method: 'POST',
    token: organizer.token,
    body: JSON.stringify({ category: 'CONCERT', name, location: 'Palais de la culture', city: 'Bamako', date, desc: 'Créé par les tests E2E', icon: '' }),
  });
  await call(`/organizer/events/${event.id}/ticket-types`, {
    method: 'POST',
    token: organizer.token,
    body: JSON.stringify({ type: 'STANDARD', price: 5000, capacity: opts.capacity ?? 100 }),
  });
  if (opts.submit || opts.approveWith) {
    await call(`/organizer/events/${event.id}/submit`, { method: 'POST', token: organizer.token });
  }
  if (opts.approveWith) {
    await call(`/admin/events/${event.id}/approve`, { method: 'POST', token: opts.approveWith });
  }
  // L'approbation ne publie plus : la mise en ligne est une décision de l'organisateur.
  if (opts.approveWith && opts.publish) {
    await call(`/organizer/events/${event.id}/publish`, { method: 'POST', token: organizer.token });
  }
  return { id: event.id, name };
}

export async function createStaff(organizer: TestOrganizer, agentName: string): Promise<{ id: string; staffCode: string }> {
  const staffCode = `E2E-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
  return call('/organizer/staff', { method: 'POST', token: organizer.token, body: JSON.stringify({ staffCode, agentName }) });
}

export async function getEventImageUrl(token: string, eventId: string, role: 'admin' | 'organizer'): Promise<string | null> {
  const path = role === 'admin' ? `/admin/events/${eventId}` : `/organizer/events/${eventId}`;
  const event = await call<{ imageUrl: string | null }>(path, { token });
  return event.imageUrl;
}

export interface EventSummary {
  id: string;
  name: string;
  status: string;
  imageUrl: string | null;
  tickets: { type: string; price: number; capacity: number | null }[];
}

export async function findOrganizerEventByName(organizer: TestOrganizer, name: string): Promise<EventSummary | undefined> {
  const events = await call<EventSummary[]>('/organizer/events', { token: organizer.token });
  return events.find((e) => e.name === name);
}

export async function findAdminEventByName(adminToken: string, name: string): Promise<EventSummary | undefined> {
  const events = await call<EventSummary[]>('/admin/events', { token: adminToken });
  return events.find((e) => e.name === name);
}
