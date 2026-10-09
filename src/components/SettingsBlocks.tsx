import { useState } from 'react';
import { PasswordInput } from './PasswordInput';

// Blocs communs aux pages Paramètres (ADMIN et organisateur).

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
  marginBottom: 18,
  maxWidth: 760,
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  marginBottom: 14,
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 6, display: 'block' };

export function SettingsCard(props: Readonly<{ title: string; hint?: React.ReactNode; children: React.ReactNode; testId?: string }>) {
  const { title, hint, children, testId } = props;
  return (
    <section className="bo-card" style={cardStyle} data-testid={testId}>
      <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 700, color: '#1F2E35', margin: hint ? '0 0 4px' : '0 0 16px' }}>
        {title}
      </h2>
      {hint && <p style={{ fontSize: 12.5, color: '#6B6459', lineHeight: 1.5, margin: '0 0 16px' }}>{hint}</p>}
      {children}
    </section>
  );
}

/** Ligne « libellé — valeur » d'une information non modifiable. */
export function InfoRow({ label, value, last = false }: Readonly<{ label: string; value: React.ReactNode; last?: boolean }>) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        padding: '9px 0',
        borderBottom: last ? 'none' : '1px solid #F2EEE6',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#6B6459' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#1F2E35', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function TextField(props: Readonly<{ id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }>) {
  const { id, label, value, onChange, placeholder } = props;
  return (
    <>
      <label style={labelStyle} htmlFor={id}>
        {label}
      </label>
      <input id={id} style={fieldStyle} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </>
  );
}

export function PrimaryButton(props: Readonly<{ label: string; onClick: () => void; disabled?: boolean }>) {
  const { label, onClick, disabled = false } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 18px',
        border: 'none',
        background: '#164A23',
        color: '#FAF3EB',
        borderRadius: 8,
        fontFamily: "'Poppins',sans-serif",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

export function Notice({ kind, children }: Readonly<{ kind: 'success' | 'error'; children: React.ReactNode }>) {
  const color = kind === 'success' ? '#164A23' : '#CE1126';
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      style={{
        marginTop: 12,
        padding: '9px 12px',
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 600,
        color,
        background: kind === 'success' ? 'rgba(22,74,35,0.08)' : 'rgba(206,17,38,0.08)',
      }}
    >
      {children}
    </div>
  );
}

/** Changement de mot de passe : actuel + nouveau (8 caractères au moins), avec l'œil sur chaque champ. */
export function PasswordChangeCard({ onSubmit }: Readonly<{ onSubmit: (current: string, next: string) => Promise<void> }>) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setError(null);
    setSaved(false);
    if (next.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(current, next);
      setCurrent('');
      setNext('');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsCard title="Changer le mot de passe" hint="Au moins 8 caractères. Vous restez connecté après le changement." testId="password-card">
      <label style={labelStyle} htmlFor="current-password">
        Mot de passe actuel
      </label>
      <PasswordInput id="current-password" style={fieldStyle} value={current} onChange={setCurrent} autoComplete="current-password" />
      <label style={labelStyle} htmlFor="new-password">
        Nouveau mot de passe
      </label>
      <PasswordInput id="new-password" style={fieldStyle} value={next} onChange={setNext} autoComplete="new-password" />
      <PrimaryButton label="Mettre à jour le mot de passe" onClick={submit} disabled={busy || !current || !next} />
      {error && <Notice kind="error">{error}</Notice>}
      {saved && <Notice kind="success">Mot de passe mis à jour.</Notice>}
    </SettingsCard>
  );
}
