import { useState } from 'react';
import {
  addTicketType,
  deleteTicketType,
  getEvent,
  getEventScanRecords,
  getEventStats,
  getEventTickets,
  updateTicketType,
} from '../api/events';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState } from '../components/LoadingState';
import type { EventItem, EventTicket, TicketType } from '../types';

interface EventDetailViewProps {
  event: EventItem;
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#FAF3EB',
  borderRadius: 8,
};

const selectStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1.5px solid #E7DED0',
  borderRadius: 7,
  fontSize: 12,
  background: '#FFFFFF',
  color: '#1F2E35',
};

const smallBtn = (color: string): React.CSSProperties => ({
  padding: '6px 10px',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
});

const TICKET_TYPES: TicketType[] = ['VIP', 'STANDARD', 'EARLY_BIRD'];
const TICKET_LABELS: Record<TicketType, string> = { VIP: 'Billet VIP', STANDARD: 'Billet Standard', EARLY_BIRD: 'Billet Early Bird' };

const STATUS_COLOR: Record<string, [string, string]> = {
  VALID: ['#0F9430', 'rgba(20,181,58,0.12)'],
  USED: ['#9A7800', 'rgba(252,209,22,0.2)'],
  INVALID: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

export function EventDetailView(props: Readonly<EventDetailViewProps>) {
  const { event: initialEvent, onBack } = props;
  const { data: eventRows, loading: eventLoading, reload: reloadEvent } = useCollection(() =>
    getEvent(initialEvent.id).then((e) => [e])
  );
  const { data: statsRows, loading: statsLoading } = useCollection(() => getEventStats(initialEvent.id).then((s) => [s]));
  const { data: tickets, loading: ticketsLoading } = useCollection(() => getEventTickets(initialEvent.id));
  const { data: scanRecords, loading: scanLoading } = useCollection(() => getEventScanRecords(initialEvent.id));

  const [newType, setNewType] = useState<TicketType>('STANDARD');
  const [newPrice, setNewPrice] = useState('');
  const [editingType, setEditingType] = useState<Record<string, string>>({});
  const { run, banner } = useActionError();

  if (eventLoading || statsLoading || ticketsLoading || scanLoading || eventRows.length === 0) {
    return <LoadingState label="Chargement de l'événement…" />;
  }
  const event = eventRows[0];
  const stats = statsRows[0];

  const addNewTicketType = () =>
    run(async () => {
      const price = Number(newPrice);
      if (!(price > 0)) throw new Error('Renseignez un prix positif.');
      await addTicketType(event.id, { type: newType, price });
      setNewPrice('');
      reloadEvent();
    });

  const startEditType = (tt: EventTicket) => setEditingType((r) => ({ ...r, [tt.id]: String(tt.price) }));

  const saveType = (tt: EventTicket) =>
    run(async () => {
      const price = editingType[tt.id];
      if (!price) return;
      await updateTicketType(event.id, tt.id, { price: Number(price) });
      setEditingType((r) => {
        const { [tt.id]: _removed, ...rest } = r;
        return rest;
      });
      reloadEvent();
    });

  const removeType = (tt: EventTicket) =>
    run(async () => {
      await deleteTicketType(event.id, tt.id);
      reloadEvent();
    });

  return (
    <div className="bo-page">
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#164A23',
          cursor: 'pointer',
          marginBottom: 18,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        ← Retour aux événements
      </button>
      {banner}

      <div
        className="bo-hero"
        style={{
          background: 'linear-gradient(135deg,#164A23,#0F3419)',
          borderRadius: 14,
          padding: '26px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600, marginBottom: 4 }}>
          {event.city} · {event.location}
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>
          {event.icon} {event.name}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          {new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
        </div>
        {event.desc && <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.85)', marginTop: 10 }}>{event.desc}</div>}
      </div>

      {stats && (
        <div className="bo-kpi-grid" style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Billets émis', value: stats.totalTickets },
            { label: 'Billets scannés', value: stats.scanned },
            { label: 'Scans valides', value: stats.valid },
            { label: 'Scans refusés', value: stats.invalid + stats.used },
          ].map((k) => (
            <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E7DED0', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(31,46,53,0.06)' }}>
              <div style={{ fontSize: 11.5, color: '#6B6459', fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 24, fontWeight: 800, color: '#164A23' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Types de billets</div>

          <div className="bo-compact-form-row" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={newType} onChange={(e) => setNewType(e.target.value as TicketType)} style={selectStyle}>
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TICKET_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Prix (FCFA)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              style={{ ...selectStyle, flex: 1 }}
            />
            <button type="button" onClick={addNewTicketType} style={smallBtn('#164A23')}>
              Ajouter
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {event.tickets.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun type de billet.</div>}
            {event.tickets.map((tt) => {
              const draft = editingType[tt.id];
              return (
                <div key={tt.id} style={rowStyle}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>{TICKET_LABELS[tt.type]}</div>
                  {draft !== undefined ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={draft}
                        onChange={(e) => setEditingType((r) => ({ ...r, [tt.id]: e.target.value }))}
                        style={{ ...selectStyle, width: 110 }}
                      />
                      <button type="button" onClick={() => saveType(tt)} style={smallBtn('#164A23')}>
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6B6459' }}>{tt.price.toLocaleString('fr-FR')} FCFA</span>
                      <button type="button" onClick={() => startEditType(tt)} style={smallBtn('#164A23')}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => removeType(tt)} style={smallBtn('#A6341D')}>
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bo-detail-grid" style={{ display: 'grid', gap: 18 }}>
          <div className="bo-card" style={cardStyle}>
            <div style={cardTitleStyle}>Billets émis ({tickets.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {tickets.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun billet émis.</div>}
              {tickets.map((t) => (
                <div key={t.code} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2E35' }}>{t.holder}</div>
                    <div style={{ fontSize: 11, color: '#6B6459' }}>
                      {t.code} · {t.type}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      color: t.used ? '#9A7800' : '#0F9430',
                      background: t.used ? 'rgba(252,209,22,0.2)' : 'rgba(20,181,58,0.12)',
                    }}
                  >
                    {t.used ? `Utilisé ${t.usedAt ?? ''}` : 'Non utilisé'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bo-card" style={cardStyle}>
            <div style={cardTitleStyle}>Historique des scans ({scanRecords.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {scanRecords.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun scan enregistré.</div>}
              {scanRecords.map((s, idx) => {
                const [color, bg] = STATUS_COLOR[s.status] ?? ['#1F2E35', '#E4E9EB'];
                return (
                  <div key={`${s.code}-${idx}`} style={rowStyle}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2E35' }}>{s.code}</div>
                      <div style={{ fontSize: 11, color: '#6B6459' }}>
                        {s.staffName} · {s.time}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        color,
                        background: bg,
                      }}
                    >
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
