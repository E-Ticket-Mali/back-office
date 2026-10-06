// Petits blocs visuels partagés par les vues ajoutées avec la navigation par rôle
// (sous-menus ADMIN / ORGANIZER). Mêmes valeurs que les styles inline existants.

export const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 10,
  padding: 18,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

export const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  background: '#164A23',
  color: '#FAF3EB',
  borderRadius: 7,
  padding: '7px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 12.5,
};

export const outlineButtonStyle: React.CSSProperties = {
  border: '1px solid #164A23',
  background: 'transparent',
  color: '#164A23',
  borderRadius: 7,
  padding: '7px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 12.5,
};

export const dangerButtonStyle: React.CSSProperties = {
  ...outlineButtonStyle,
  borderColor: '#CE1126',
  color: '#CE1126',
};

export const inputStyle: React.CSSProperties = {
  padding: '8px 11px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13,
  color: '#1F2E35',
  background: '#FFFFFF',
};

export const mutedText: React.CSSProperties = { color: '#6B6459', fontSize: 13 };

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString('fr-FR') : '—';
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count.toLocaleString('fr-FR')} ${count > 1 ? pluralForm : singular}`;
}
