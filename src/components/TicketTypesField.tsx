import { newTicketDraft, TICKET_TYPE_LABELS, TICKET_TYPES, type TicketDraft } from '../utils/ticketDrafts';
import type { TicketType } from '../types';

type TicketTypesFieldProps = Readonly<{
  value: TicketDraft[];
  onChange: (next: TicketDraft[]) => void;
}>;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13,
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: '#FFFFFF',
};

const headStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#6B6459', textTransform: 'uppercase', letterSpacing: 0.4 };
const GRID = '1fr 1fr 1fr 32px';

/** Tarifs fixés dès la création de l'événement : type, prix (0 = gratuit), capacité (vide = illimitée). */
export function TicketTypesField({ value, onChange }: TicketTypesFieldProps) {
  const used = new Set(value.map((d) => d.type));
  const available = TICKET_TYPES.filter((t) => !used.has(t));

  const update = (key: number, patch: Partial<TicketDraft>) => onChange(value.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  return (
    <div data-testid="ticket-types-field">
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 6, display: 'block' }}>
        Billets &amp; tarifs <span style={{ color: '#A6341D' }}>*</span>
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 8, marginBottom: 6 }}>
        <span style={headStyle}>Type</span>
        <span style={headStyle}>Prix (FCFA)</span>
        <span style={headStyle}>Capacité</span>
        <span />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {value.map((d, index) => (
          <div key={d.key} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 8, alignItems: 'center' }}>
            <select
              aria-label={`Type du tarif ${index + 1}`}
              value={d.type}
              onChange={(e) => update(d.key, { type: e.target.value as TicketType })}
              style={inputStyle}
            >
              {TICKET_TYPES.filter((t) => t === d.type || !used.has(t)).map((t) => (
                <option key={t} value={t}>
                  {TICKET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              aria-label={`Prix du tarif ${TICKET_TYPE_LABELS[d.type]}`}
              type="number"
              min={0}
              step="any"
              placeholder="0 = gratuit"
              value={d.price}
              onChange={(e) => update(d.key, { price: e.target.value })}
              style={inputStyle}
            />
            <input
              aria-label={`Capacité du tarif ${TICKET_TYPE_LABELS[d.type]}`}
              type="number"
              min={1}
              step={1}
              placeholder="Illimitée"
              value={d.capacity}
              onChange={(e) => update(d.key, { capacity: e.target.value })}
              style={inputStyle}
            />
            <button
              type="button"
              aria-label={`Retirer le tarif ${TICKET_TYPE_LABELS[d.type]}`}
              disabled={value.length === 1}
              onClick={() => onChange(value.filter((x) => x.key !== d.key))}
              style={{
                width: 32,
                height: 32,
                border: '1px solid #E7DED0',
                borderRadius: 8,
                background: 'transparent',
                color: '#A6341D',
                cursor: value.length === 1 ? 'not-allowed' : 'pointer',
                opacity: value.length === 1 ? 0.4 : 1,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {available.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([...value, newTicketDraft(available[0])])}
          style={{
            marginTop: 8,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px dashed #164A23',
            background: 'transparent',
            color: '#164A23',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Ajouter un tarif
        </button>
      )}
    </div>
  );
}
