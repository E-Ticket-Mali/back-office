// Design tokens ported 1:1 from the original mockup (do not alter values).

export const GREEN = '#0F3419';
export const GREEN_BG = '#DCE7DD';
export const GOLD = '#8A5F17';
export const GOLD_BG = '#E9D3A8';
export const RED = '#8A2E17';
export const RED_BG = '#F5DCD4';
export const NAVY = '#1F2E35';
export const NAVY_BG = '#E4E9EB';

export const COLORS = {
  sidebarBg: '#164A23',
  sidebarBgHover: '#0F3419',
  pageBg: '#FAF3EB',
  cardBg: '#FFFFFF',
  cardBorder: '#E7DED0',
  textPrimary: '#1F2E35',
  textSecondary: '#6B6459',
  gold: '#A6741D',
  cream: '#FAF3EB',
  sand: '#E9D3A8',
  disableRed: '#A6341D',
  toggleTrack: '#F2EEE6',
} as const;

export type StatusPair = readonly [string, string];

export function statusColor(s: string): StatusPair {
  if (['En cours', 'Actif', 'Bon état', 'Disponible', 'Clôturée'].includes(s)) {
    return [GREEN, GREEN_BG];
  }
  if (['Préparation', 'Planifiée', 'À réviser'].includes(s)) {
    return [GOLD, GOLD_BG];
  }
  if (['Défectueux', 'Inactif', 'Indisponible'].includes(s)) {
    return [RED, RED_BG];
  }
  return [NAVY, NAVY_BG];
}

export const TYPE_COLOR: Record<string, StatusPair> = {
  Engrais: [GREEN, GREEN_BG],
  Herbicides: [GOLD, GOLD_BG],
  Materiels: [NAVY, NAVY_BG],
  Semence: [RED, RED_BG],
};
