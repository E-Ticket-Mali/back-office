// Compte organisateur de démonstration pour essayer le back-office en LOCAL.
//   npm run seed:demo            (backend local sur http://localhost:5000)
//   E2E_API_URL=... npm run seed:demo
// Idempotent : si le compte existe déjà, seuls les éléments manquants sont recréés.
// Ne jamais lancer contre le backend déployé.

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5000/api/v1';

if (!/localhost|127\.0\.0\.1/.test(API) && !process.env.ALLOW_REMOTE_SEED) {
  console.error(`Refus : ${API} n'est pas un backend local (ALLOW_REMOTE_SEED=1 pour forcer).`);
  process.exit(1);
}

/** Compte admin de démo seedé par le backend (application.yml : DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD). */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@eticket.ml', password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123' };

/** Organisateur de démo — valeurs de test, uniquement pour un backend local. */
export const DEMO_ORGANIZER = {
  name: 'Démo Productions',
  email: 'demo.organisateur@eticket.test',
  password: 'Demo-Orga-2026!',
  phone: '+22370000999',
  nif: 'NIFDEMO0001',
  rccm: 'RCCMDEMO0001',
};

async function call(path, { method = 'GET', token, body } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : undefined;
}

async function tryLogin(email, password) {
  try {
    return (await call('/auth/login', { method: 'POST', body: { email, password } })).token;
  } catch {
    return null;
  }
}

async function ensureOrganizer(adminToken) {
  let token = await tryLogin(DEMO_ORGANIZER.email, DEMO_ORGANIZER.password);
  if (token) return token;

  const form = new FormData();
  for (const key of ['name', 'email', 'password', 'phone', 'nif', 'rccm']) form.append(key, DEMO_ORGANIZER[key]);
  form.append('documentKind', 'NIF');
  form.append('document', new Blob(['%PDF-1.4\n%demo\n'], { type: 'application/pdf' }), 'nif.pdf');
  await call('/auth/organizer/register', { method: 'POST', body: form });

  const pending = await call('/admin/organizers?status=PENDING', { token: adminToken });
  const created = pending.find((o) => o.email === DEMO_ORGANIZER.email);
  await call(`/admin/organizers/${created.id}/approve`, { method: 'POST', token: adminToken });
  token = await tryLogin(DEMO_ORGANIZER.email, DEMO_ORGANIZER.password);
  if (!token) throw new Error('Connexion impossible après inscription du compte de démo.');
  console.log('✓ Organisateur de démo créé et approuvé');
  return token;
}

const inDays = (d) => new Date(Date.now() + d * 24 * 3600 * 1000).toISOString().slice(0, 19) + 'Z';

/** target : statut final voulu pour l'événement de démo. */
const DEMO_EVENTS = [
  { name: 'Démo — Festival (brouillon)', category: 'CONCERT', city: 'Bamako', location: 'Palais de la culture', days: 40, target: 'DRAFT' },
  { name: 'Démo — Gala (en attente)', category: 'THEATRE', city: 'Bamako', location: 'Blonba', days: 50, target: 'PENDING_APPROVAL' },
  { name: 'Démo — Derby (validé, à publier)', category: 'HIPPIQUE', city: 'Bamako', location: 'Hippodrome', days: 30, target: 'APPROVED' },
  { name: 'Démo — Match (en ligne)', category: 'SPORT', city: 'Bamako', location: 'Stade du 26 mars', days: 20, target: 'PUBLISHED' },
];

async function ensureEvents(token, adminToken) {
  const existing = await call('/organizer/events', { token });
  const byName = new Map(existing.map((e) => [e.name, e]));
  const published = [];
  for (const spec of DEMO_EVENTS) {
    let event = byName.get(spec.name);
    if (!event) {
      event = await call('/organizer/events', {
        method: 'POST',
        token,
        body: { category: spec.category, name: spec.name, city: spec.city, location: spec.location, date: inDays(spec.days), desc: 'Événement de démonstration.', icon: '' },
      });
      await call(`/organizer/events/${event.id}/ticket-types`, { method: 'POST', token, body: { type: 'STANDARD', price: 5000, capacity: 200 } });
      await call(`/organizer/events/${event.id}/ticket-types`, { method: 'POST', token, body: { type: 'VIP', price: 15000, capacity: 40 } });
      if (spec.target !== 'DRAFT') await call(`/organizer/events/${event.id}/submit`, { method: 'POST', token });
      if (spec.target === 'APPROVED' || spec.target === 'PUBLISHED') await call(`/admin/events/${event.id}/approve`, { method: 'POST', token: adminToken });
      if (spec.target === 'PUBLISHED') await call(`/organizer/events/${event.id}/publish`, { method: 'POST', token });
      console.log(`✓ ${spec.name}`);
    }
    if (spec.target === 'PUBLISHED') published.push(event);
  }
  return published;
}

async function ensureAgent(token, publishedEvents) {
  const staff = await call('/organizer/staff', { token });
  let agent = staff.find((a) => a.staffCode === 'DEMO-AGENT-1');
  if (!agent) {
    agent = await call('/organizer/staff', { method: 'POST', token, body: { staffCode: 'DEMO-AGENT-1', agentName: 'Agent Démo' } });
    console.log('✓ Agent contrôleur de démo');
  }
  const assigned = new Set((await call(`/organizer/staff/${agent.id}/events`, { token })).map((e) => e.id));
  for (const event of publishedEvents) {
    if (!assigned.has(event.id)) await call(`/organizer/staff/${agent.id}/events/${event.id}`, { method: 'POST', token });
  }
}

const adminToken = await tryLogin(ADMIN.email, ADMIN.password);
if (!adminToken) {
  console.error(`Connexion admin impossible sur ${API} — le backend local est-il lancé ?`);
  process.exit(1);
}
const organizerToken = await ensureOrganizer(adminToken);
const published = await ensureEvents(organizerToken, adminToken);
await ensureAgent(organizerToken, published);
console.log(`\nCompte de démo prêt sur ${API} — identifiants : DEMO_ORGANIZER dans scripts/seed-demo.mjs`);
