import type { EventCategory, OrganizerEventStatus } from '../types';

export const EVENT_CATEGORIES: EventCategory[] = ['HIPPIQUE', 'CONCERT', 'SPORT', 'CONFERENCE', 'CINEMA', 'THEATRE'];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  HIPPIQUE: 'Courses hippiques',
  CONCERT: 'Concert',
  SPORT: 'Sport',
  CONFERENCE: 'Conférence',
  CINEMA: 'Cinéma',
  THEATRE: 'Théâtre',
};

/** Vocabulaire de l'interface (le code garde les valeurs techniques `PENDING_APPROVAL`, `APPROVED`…). */
export const ORGANIZER_STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'En cours de validation',
  APPROVED: 'Validé, à publier',
  PUBLISHED: 'Publié',
  UNPUBLISHED: 'Dépublié',
  REJECTED: 'Rejeté',
};

/** Seule une validation en cours verrouille l'événement ; une modification publiée déclenche une nouvelle revue. */
export function isOrganizerEventEditable(status: OrganizerEventStatus): boolean {
  return status !== 'PENDING_APPROVAL';
}
