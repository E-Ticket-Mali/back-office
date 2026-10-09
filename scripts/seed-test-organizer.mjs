// Remplit le compte « Test Organizer » de données fictives, pour essayer l'espace organisateur en LOCAL :
// profil et justificatifs, événements à tous les statuts, agents de contrôle, clients et réservations.
//   npm run seed:testorg          (backend local sur http://127.0.0.1:5000)
// Idempotent : ce qui existe déjà n'est pas recréé. Ne jamais lancer contre le backend déployé.

import fs from 'node:fs';
import path from 'node:path';

const COVER = path.resolve('e2e/assets/cover.png');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5000/api/v1';

if (!/localhost|127\.0\.0\.1/.test(API) && !process.env.ALLOW_REMOTE_SEED) {
  console.error(`Refus : ${API} n'est pas un backend local (ALLOW_REMOTE_SEED=1 pour forcer).`);
  process.exit(1);
}

/** Comptes créés par le backend au démarrage (application.yml : app.demo.*). */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@eticket.ml', password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123' };
const ORGANIZER = { email: process.env.DEMO_ORGANIZER_EMAIL ?? 'testorg@example.com', password: process.env.DEMO_ORGANIZER_PASSWORD ?? 'org123' };
/** Code PIN commun aux clients fictifs. */
const CLIENT_PIN = '4821';

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

const login = async (account) => (await call('/auth/login', { method: 'POST', body: account })).token;
const at = (days, hour) => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + days, hour)).toISOString().slice(0, 19) + 'Z';

/** Générateur déterministe : les mêmes données à chaque exécution. */
let seed = 20261009;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (list) => list[Math.floor(rand() * list.length)];

const EVENTS = [
  {
    name: 'Festival sur le Niger',
    category: 'CONCERT', city: 'Ségou', location: 'Quai des arts', days: 21, hour: 18, hours: 30, target: 'PUBLISHED',
    desc: "Trois scènes au bord du fleuve : musiques mandingues, afrobeat et jeunes talents. Restauration sur place, navettes depuis le centre-ville.",
    tickets: [
      { type: 'EARLY_BIRD', name: 'Prévente', price: 4000, capacity: 150 },
      { type: 'STANDARD', name: 'Pass journée', price: 7500, capacity: 600 },
      { type: 'VIP', name: 'Carré VIP', price: 25000, capacity: 60 },
    ],
  },
  {
    name: 'Grand Prix de Bamako',
    category: 'HIPPIQUE', city: 'Bamako', location: 'Hippodrome de Bamako', days: 12, hour: 15, hours: 4, target: 'PUBLISHED',
    desc: 'Huit courses, les meilleurs jockeys de la sous-région et un village partenaires. Ouverture des portes à 14 h.',
    tickets: [
      { type: 'STANDARD', name: 'Tribune', price: 3000, capacity: 800 },
      { type: 'VIP', name: 'Loge', price: 20000, capacity: 40 },
    ],
  },
  {
    name: 'Derby Stade Malien – Djoliba',
    category: 'SPORT', city: 'Bamako', location: 'Stade du 26 Mars', days: 8, hour: 16, hours: 2, target: 'PUBLISHED',
    desc: 'Le choc de la saison. Placement libre en virage, places numérotées en tribune couverte.',
    tickets: [
      { type: 'STANDARD', name: 'Virage', price: 1500, capacity: 2000 },
      { type: 'STANDARD', name: 'Tribune couverte', price: 5000, capacity: 500 },
      { type: 'VIP', name: 'Présidentielle', price: 15000, capacity: 80 },
    ],
  },
  {
    name: 'Forum du numérique',
    category: 'CONFERENCE', city: 'Bamako', location: 'CICB', days: 35, hour: 9, hours: 9, target: 'PUBLISHED',
    desc: 'Une journée de conférences et d’ateliers : paiement mobile, e-commerce, intelligence artificielle. Déjeuner inclus avec le pass complet.',
    tickets: [
      { type: 'STANDARD', name: 'Conférences', price: 10000, capacity: 300 },
      { type: 'VIP', name: 'Pass complet', price: 30000, capacity: 80 },
    ],
  },
  {
    name: 'Nuit du cinéma africain',
    category: 'CINEMA', city: 'Bamako', location: 'Ciné Magic Babemba', days: 28, hour: 20, hours: 5, target: 'APPROVED',
    desc: 'Trois films primés au FESPACO, en présence des équipes. Validé : il reste à le publier.',
    tickets: [{ type: 'STANDARD', name: 'Entrée', price: 2500, capacity: 250 }],
  },
  {
    name: 'Soirée théâtre : Les Bouts de bois de Dieu',
    category: 'THEATRE', city: 'Bamako', location: 'Blonba', days: 45, hour: 19, hours: 3, target: 'PENDING_APPROVAL',
    desc: "Adaptation du roman de Sembène Ousmane par la troupe du Blonba. En attente de validation.",
    tickets: [
      { type: 'STANDARD', name: 'Orchestre', price: 5000, capacity: 180 },
      { type: 'STANDARD', name: 'Balcon', price: 3000, capacity: 120 },
    ],
  },
  {
    name: 'Concert de fin d’année',
    category: 'CONCERT', city: 'Sikasso', location: 'Stade Babemba Traoré', days: 80, hour: 20, hours: 5, target: 'DRAFT',
    desc: 'Brouillon : programmation en cours.',
    tickets: [{ type: 'STANDARD', name: 'Pelouse', price: 3000, capacity: 1500 }],
  },
];

const FIRST_NAMES = ['Awa', 'Moussa', 'Fatoumata', 'Ibrahim', 'Mariam', 'Seydou', 'Aminata', 'Oumar', 'Kadiatou', 'Bakary', 'Rokia', 'Modibo', 'Djeneba', 'Adama', 'Salimata', 'Cheick', 'Hawa', 'Boubacar', 'Assetou', 'Mamadou', 'Nana', 'Souleymane', 'Oumou', 'Drissa', 'Bintou', 'Yacouba', 'Safiatou', 'Lassana', 'Korotoumou', 'Amadou'];
const LAST_NAMES = ['Traoré', 'Keita', 'Coulibaly', 'Diarra', 'Sidibé', 'Konaté', 'Diallo', 'Touré', 'Sangaré', 'Dembélé', 'Cissé', 'Koné', 'Maïga', 'Doumbia', 'Camara'];
const CLIENT_COUNT = 30;
const PAYMENT_METHODS = ['ORANGE_MONEY', 'ORANGE_MONEY', 'WAVE'];

async function ensureProfile(token) {
  const profile = await call('/organizer/profile', { token });
  const patch = {};
  if (!profile.nif) patch.nif = 'NIF-086541237X';
  if (!profile.rccm) patch.rccm = 'MA.BKO.2024.B.4512';
  if (Object.keys(patch).length) await call('/organizer/profile', { method: 'PATCH', token, body: patch });

  const documents = await call('/organizer/profile/documents', { token });
  for (const kind of ['NIF', 'RCCM', 'ID_PIECE']) {
    if (documents.some((d) => d.kind === kind)) continue;
    const form = new FormData();
    form.append('file', new Blob([`%PDF-1.4\n% Justificatif fictif ${kind}\n`], { type: 'application/pdf' }), `${kind.toLowerCase()}.pdf`);
    await call(`/organizer/profile/documents?kind=${kind}`, { method: 'POST', token, body: form });
  }
  console.log('✓ Profil et justificatifs');
}

async function ensureEvents(token, adminToken) {
  const byName = new Map((await call('/organizer/events', { token })).map((e) => [e.name, e]));
  const published = [];
  for (const spec of EVENTS) {
    let event = byName.get(spec.name);
    if (!event) {
      event = await call('/organizer/events', {
        method: 'POST',
        token,
        body: {
          category: spec.category, name: spec.name, city: spec.city, location: spec.location,
          date: at(spec.days, spec.hour), endDate: at(spec.days, spec.hour + spec.hours), desc: spec.desc, icon: '', tickets: spec.tickets,
        },
      });
      console.log(`✓ Événement : ${spec.name}`);
    }
    // Avance l'événement jusqu'au statut voulu (reprend aussi une exécution interrompue).
    if (!event.coverUrl) {
      const form = new FormData();
      form.append('file', new Blob([fs.readFileSync(COVER)], { type: 'image/png' }), 'cover.png');
      // Sur un événement déjà validé, changer la couverture le renvoie en validation : on relit son statut.
      event = await call(`/organizer/events/${event.id}/cover`, { method: 'POST', token, body: form });
    }
    let status = event.status;
    const wanted = spec.target;
    if (status === 'DRAFT' && wanted !== 'DRAFT') {
      await call(`/organizer/events/${event.id}/submit`, { method: 'POST', token });
      status = 'PENDING_APPROVAL';
    }
    if (status === 'PENDING_APPROVAL' && (wanted === 'APPROVED' || wanted === 'PUBLISHED')) {
      await call(`/admin/events/${event.id}/approve`, { method: 'POST', token: adminToken });
      status = 'APPROVED';
    }
    if (status === 'APPROVED' && wanted === 'PUBLISHED') await call(`/organizer/events/${event.id}/publish`, { method: 'POST', token });
    if (spec.target === 'PUBLISHED') published.push(await call(`/organizer/events/${event.id}`, { token }));
  }
  return published;
}

async function ensureAgents(token, published) {
  const staff = await call('/organizer/staff', { token });
  const specs = [
    { staffCode: 'TESTORG-PORTE-A', agentName: 'Issa Kanté — Porte A' },
    { staffCode: 'TESTORG-PORTE-B', agentName: 'Fanta Sacko — Porte B' },
    { staffCode: 'TESTORG-VIP', agentName: 'Abdoulaye Sow — Accueil VIP' },
  ];
  for (const spec of specs) {
    const agent = staff.find((a) => a.staffCode === spec.staffCode) ?? (await call('/organizer/staff', { method: 'POST', token, body: spec }));
    const assigned = new Set((await call(`/organizer/staff/${agent.id}/events`, { token })).map((e) => e.id));
    for (const event of published) {
      if (!assigned.has(event.id)) await call(`/organizer/staff/${agent.id}/events/${event.id}`, { method: 'POST', token });
    }
  }
  console.log('✓ Agents de contrôle affectés aux événements en ligne');
}

/** Crée le client fictif n° `index`, ou le reconnecte s'il existe déjà. */
async function clientToken(index) {
  const phone = `+2237611${String(1000 + index)}`;
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(index * 7) % LAST_NAMES.length];
  try {
    await call('/auth/client/request-otp', { method: 'POST', body: { phone } });
    await call('/auth/client/register', {
      method: 'POST',
      body: { phone, firstName, lastName, birthDate: `19${80 + (index % 20)}-0${1 + (index % 9)}-15`, gender: index % 2 ? 'MALE' : 'FEMALE' },
    });
    return (await call('/auth/client/set-pin', { method: 'POST', body: { phone, pin: CLIENT_PIN } })).token;
  } catch {
    return (await call('/auth/client/verify-pin', { method: 'POST', body: { phone, pin: CLIENT_PIN } })).token;
  }
}

async function ensureBookings(token, published) {
  const existing = await call('/organizer/customers', { token });
  if (existing.length >= CLIENT_COUNT) {
    console.log(`✓ Clients déjà présents (${existing.length})`);
    return;
  }
  let bookings = 0;
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const client = await clientToken(i);
    // Un tiers de clients fidèles (3 ou 4 événements), les autres en ont 1 ou 2.
    const count = i % 3 === 0 ? 3 + (i % 2) : 1 + (i % 2);
    const events = [...published].sort(() => rand() - 0.5).slice(0, Math.min(count, published.length));
    for (const event of events) {
      const ticket = pick(event.tickets);
      await call('/client/bookings/checkout', {
        method: 'POST',
        token: client,
        body: { kind: 'EVENT', eventId: event.id, eventTicketTypeId: ticket.id, qty: 1 + Math.floor(rand() * 4), paymentMethod: pick(PAYMENT_METHODS), momoPhone: '70000000' },
      });
      bookings++;
    }
  }
  console.log(`✓ ${CLIENT_COUNT} clients, ${bookings} réservations`);
}

async function ensurePayout(token) {
  const requests = await call('/organizer/finance/payout-requests', { token });
  if (requests.length > 0) return;
  const balance = await call('/organizer/finance/balance', { token });
  const available = Number(balance.available ?? balance.availableBalance ?? balance.balance ?? 0);
  if (available < 10000) return;
  await call('/organizer/finance/payout-requests', { method: 'POST', token, body: { amount: Math.floor(available / 3 / 1000) * 1000 } });
  console.log('✓ Demande de reversement');
}

let adminToken;
let organizerToken;
try {
  adminToken = await login(ADMIN);
  organizerToken = await login(ORGANIZER);
} catch (e) {
  console.error(`Connexion impossible sur ${API} — le backend local est-il lancé ? (${e.message})`);
  process.exit(1);
}
await ensureProfile(organizerToken);
const published = await ensureEvents(organizerToken, adminToken);
await ensureAgents(organizerToken, published);
await ensureBookings(organizerToken, published);
await ensurePayout(organizerToken).catch((e) => console.warn(`Reversement non créé : ${e.message}`));
console.log(`\nCompte « Test Organizer » rempli sur ${API} (${ORGANIZER.email}).`);
