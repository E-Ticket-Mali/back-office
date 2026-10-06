import type { EventCategory } from '../types';

/** Cover choisie dans le formulaire de création, appliquée juste après la création de l'événement. */
export type CoverChoice =
  | { kind: 'preset'; key: string; /** suit la catégorie tant que l'utilisateur n'a rien choisi */ auto: boolean }
  | { kind: 'file'; file: File; previewUrl: string };

/** Doit rester aligné sur PresetLogoCatalog.defaultKeyFor côté backend. */
export function defaultPresetFor(category: EventCategory | string | undefined): string {
  return category ? String(category).toLowerCase() : 'default';
}

export function initialCover(category: EventCategory): CoverChoice {
  return { kind: 'preset', key: defaultPresetFor(category), auto: true };
}

/**
 * Applique la cover choisie à un événement fraîchement créé. Le backend lui a déjà donné le logo
 * de sa catégorie : rien à faire si c'est ce logo qui est retenu. Renvoie un message d'avertissement
 * (au lieu de lever) si l'envoi échoue — l'événement existe déjà, on ne doit pas inciter à le recréer.
 */
export async function applyCover(
  eventId: string,
  category: string,
  cover: CoverChoice,
  api: { upload: (id: string, file: File) => Promise<unknown>; preset: (id: string, key: string) => Promise<unknown> },
): Promise<string | null> {
  try {
    if (cover.kind === 'file') await api.upload(eventId, cover.file);
    else if (cover.key !== defaultPresetFor(category)) await api.preset(eventId, cover.key);
    return null;
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'erreur inconnue';
    return `La couverture n'a pas pu être enregistrée (${reason}) : l'événement garde le logo de sa catégorie, modifiable depuis sa fiche.`;
  }
}
