import type { TicketType } from '../types';

/** Ligne de tarif saisie dans le formulaire de création (valeurs brutes des champs). */
export interface TicketDraft {
  key: number;
  type: TicketType;
  price: string;
  /** Vide = capacité illimitée. */
  capacity: string;
}

export interface TicketPayload {
  type: TicketType;
  price: number;
  capacity?: number;
}

export const TICKET_TYPES: TicketType[] = ['STANDARD', 'VIP', 'EARLY_BIRD'];
export const TICKET_TYPE_LABELS: Record<TicketType, string> = { STANDARD: 'Standard', VIP: 'VIP', EARLY_BIRD: 'Early Bird' };

let nextKey = 1;
export function newTicketDraft(type: TicketType = 'STANDARD'): TicketDraft {
  return { key: nextKey++, type, price: '', capacity: '' };
}

/** Valide les tarifs saisis et les convertit pour l'API ; lève une erreur lisible sinon. */
export function toTicketPayloads(drafts: TicketDraft[]): TicketPayload[] {
  if (drafts.length === 0) throw new Error('Ajoutez au moins un tarif de billet.');
  const seen = new Set<TicketType>();
  return drafts.map((d) => {
    const label = TICKET_TYPE_LABELS[d.type];
    if (seen.has(d.type)) throw new Error(`Le tarif ${label} apparaît deux fois.`);
    seen.add(d.type);
    const price = Number(d.price.replace(',', '.'));
    if (d.price.trim() === '' || !Number.isFinite(price) || price < 0) {
      throw new Error(`Prix invalide pour le tarif ${label} (0 = gratuit).`);
    }
    if (d.capacity.trim() === '') return { type: d.type, price };
    const capacity = Number(d.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error(`Capacité invalide pour le tarif ${label} (au moins 1, vide = illimitée).`);
    return { type: d.type, price, capacity };
  });
}
