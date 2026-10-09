import { useLayoutEffect, useRef } from 'react';
import type { AudienceBookingStatus } from '../api/organizerAudience';
import { StatusBadge } from './ui';

// Blocs communs aux écrans « public » de l'organisateur (inscrits d'un événement, clients).

export const BOOKING_STATUS: Record<AudienceBookingStatus, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: 'Confirmée', color: '#164A23', bg: 'rgba(22,74,35,0.1)' },
  PENDING: { label: 'En attente', color: '#9A7800', bg: 'rgba(252,209,22,0.2)' },
  CANCELLED: { label: 'Annulée', color: '#CE1126', bg: 'rgba(206,17,38,0.12)' },
};

export function BookingStatusBadge({ status }: Readonly<{ status: AudienceBookingStatus }>) {
  const s = BOOKING_STATUS[status];
  return <StatusBadge label={s.label} color={s.color} bg={s.bg} />;
}

/**
 * Tableau qui devient une liste de cartes sur petit écran : chaque cellule reprend le libellé de sa
 * colonne (attribut data-label, affiché par la feuille de style).
 */
export function RTable(props: Readonly<React.TableHTMLAttributes<HTMLTableElement>>) {
  const ref = useRef<HTMLTableElement>(null);
  useLayoutEffect(() => {
    const table = ref.current;
    if (!table) return;
    const labels = Array.from(table.querySelectorAll('thead th')).map((cell) => cell.textContent ?? '');
    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length !== labels.length) return;
      cells.forEach((cell, index) => cell.setAttribute('data-label', labels[index]));
    });
  });
  return <table ref={ref} {...props} className="bo-rtable" />;
}

export const th: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 11.5,
  fontWeight: 700,
  color: '#6B6459',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
export const td: React.CSSProperties = { padding: '11px 12px', fontSize: 13, color: '#1F2E35', verticalAlign: 'middle' };
export const right: React.CSSProperties = { textAlign: 'right' };

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Pastille aux initiales du client. */
export function Avatar({ name }: Readonly<{ name: string }>) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span
      aria-hidden
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(22,74,35,0.1)',
        color: '#164A23',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </span>
  );
}

export function CustomerCell({ name, phone, email }: Readonly<{ name: string; phone: string; email?: string | null }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar name={name} />
      <div>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#6B6459' }}>
          {phone}
          {email ? ` · ${email}` : ''}
        </div>
      </div>
    </div>
  );
}

export function SearchBox(props: Readonly<{ value: string; onChange: (v: string) => void; placeholder: string }>) {
  const { value, onChange, placeholder } = props;
  return (
    <input
      type="search"
      aria-label={placeholder}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        minWidth: 220,
        maxWidth: 360,
        padding: '9px 12px',
        border: '1.5px solid #E7DED0',
        borderRadius: 8,
        fontSize: 13.5,
        fontFamily: 'inherit',
        color: '#1F2E35',
      }}
    />
  );
}

export function EmptyRow({ colSpan, children }: Readonly<{ colSpan: number; children: React.ReactNode }>) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ ...td, textAlign: 'center', color: '#6B6459', padding: '28px 12px' }}>
        {children}
      </td>
    </tr>
  );
}

/** Jauge de remplissage (ex. billets vendus / capacité). */
export function Gauge({ value, max, color = '#164A23' }: Readonly<{ value: number; max: number; color?: string }>) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ height: 6, borderRadius: 3, background: '#E7DED0', overflow: 'hidden' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
    </div>
  );
}

const matches = (query: string, ...fields: (string | null | undefined)[]) => {
  const q = query.trim().toLowerCase();
  return q === '' || fields.some((f) => f?.toLowerCase().includes(q));
};
export const matchesQuery = matches;
