import type { EventCategory } from '../types';

/** Visuel de l'événement choisi dans le formulaire, appliqué juste après la création de l'événement. */
export type LogoChoice =
  | { kind: 'preset'; key: string; /** suit la catégorie tant que l'utilisateur n'a rien choisi */ auto: boolean }
  | { kind: 'file'; file: File; previewUrl: string };

/** Doit rester aligné sur PresetLogoCatalog.defaultKeyFor côté backend. */
export function defaultPresetFor(category: EventCategory | string | undefined): string {
  return category ? String(category).toLowerCase() : 'default';
}

export function initialLogo(category: EventCategory): LogoChoice {
  return { kind: 'preset', key: defaultPresetFor(category), auto: true };
}

/**
 * Applique le visuel choisi à un événement fraîchement créé. Le backend lui a déjà donné le visuel
 * de sa catégorie : rien à faire si c'est lui qui est retenu. Renvoie un message d'avertissement
 * (au lieu de lever) si l'envoi échoue — l'événement existe déjà, on ne doit pas inciter à le recréer.
 */
export async function applyLogo(
  eventId: string,
  category: string,
  logo: LogoChoice,
  api: { upload: (id: string, file: File) => Promise<unknown>; preset: (id: string, key: string) => Promise<unknown> },
): Promise<string | null> {
  try {
    if (logo.kind === 'file') await api.upload(eventId, logo.file);
    else if (logo.key !== defaultPresetFor(category)) await api.preset(eventId, logo.key);
    return null;
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'erreur inconnue';
    return `Le visuel n'a pas pu être enregistré (${reason}) : l'événement garde le visuel de sa catégorie, modifiable depuis sa fiche.`;
  }
}

/** Idem pour l'image de couverture, facultative à la création (exigée à la publication). */
export async function applyCoverFile(
  eventId: string,
  file: File | null,
  upload: (id: string, file: File) => Promise<unknown>,
): Promise<string | null> {
  if (!file) return null;
  try {
    await upload(eventId, file);
    return null;
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'erreur inconnue';
    return `L'image de couverture n'a pas pu être enregistrée (${reason}) : ajoutez-la depuis la fiche de l'événement.`;
  }
}
