import type { TicketType } from '../types';

/** Catégorie de billet saisie dans le formulaire d'événement (valeurs brutes des champs). */
export interface TicketDraft {
  key: number;
  name: string;
  price: string;
  /** Vide = quantité illimitée. */
  capacity: string;
  description: string;
}

export interface TicketPayload {
  type: TicketType;
  name: string;
  price: number;
  capacity?: number;
  description?: string;
}

let nextKey = 1;
export function newTicketDraft(): TicketDraft {
  return { key: nextKey++, name: '', price: '', capacity: '', description: '' };
}

/** Palier (pastille mobile) déduit du nom : « VIP… » → VIP, « Early… » / « Prévente » → EARLY_BIRD, sinon STANDARD. */
export function tierFor(name: string): TicketType {
  const n = name.toLowerCase();
  if (n.includes('vip')) return 'VIP';
  if (n.includes('early') || n.includes('prévente') || n.includes('prevente')) return 'EARLY_BIRD';
  return 'STANDARD';
}

/** Valide une catégorie saisie et la convertit pour l'API ; lève une erreur lisible sinon. */
export function toTicketPayload(d: Omit<TicketDraft, 'key'>): TicketPayload {
  const name = d.name.trim();
  if (name === '') throw new Error('Le nom de la catégorie de billet est requis.');
  if (name.length > 80) throw new Error('Le nom de la catégorie ne peut pas dépasser 80 caractères.');
  const price = Number(d.price.replace(/\s/g, '').replace(',', '.'));
  if (d.price.trim() === '' || !Number.isFinite(price) || price < 0) {
    throw new Error(`Prix invalide pour « ${name} » (0 = gratuit).`);
  }
  const description = d.description.trim() === '' ? undefined : d.description.trim();
  const base = { type: tierFor(name), name, price, description };
  if (d.capacity.trim() === '') return base;
  const capacity = Number(d.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error(`Quantité invalide pour « ${name} » (au moins 1, vide = illimitée).`);
  }
  return { ...base, capacity };
}

/** Valide l'ensemble des catégories d'un événement : au moins une, noms uniques. */
export function toTicketPayloads(drafts: TicketDraft[]): TicketPayload[] {
  if (drafts.length === 0) throw new Error('Ajoutez au moins une catégorie de billet.');
  const seen = new Set<string>();
  return drafts.map((d) => {
    const payload = toTicketPayload(d);
    const key = payload.name.toLowerCase();
    if (seen.has(key)) throw new Error(`La catégorie « ${payload.name} » apparaît deux fois.`);
    seen.add(key);
    return payload;
  });
}
