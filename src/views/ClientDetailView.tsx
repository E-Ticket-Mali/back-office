import { getClient } from '../api/clients';
import { getBookings } from '../api/bookings';
import { useCollection } from '../hooks/useCollection';
import { LoadingState } from '../components/LoadingState';
import type { AdminClient, BookingStatus } from '../types';
import { Icon } from '../components/Icon';

interface ClientDetailViewProps {
  client: AdminClient;
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#FAF3EB',
  borderRadius: 8,
};

const STATUS_LABEL: Record<BookingStatus, string> = { CONFIRMED: 'Confirmée', PENDING: 'En attente', CANCELLED: 'Annulée' };
const STATUS_COLORS: Record<BookingStatus, [string, string]> = {
  CONFIRMED: ['#0F9430', 'rgba(20,181,58,0.12)'],
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  CANCELLED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

export function ClientDetailView(props: Readonly<ClientDetailViewProps>) {
  const { client: initial, onBack } = props;
  const { data: clientRows, loading: clientLoading } = useCollection(() => getClient(initial.id).then((c) => [c]));
  const { data: bookings, loading: bookingsLoading } = useCollection(getBookings);

  if (clientLoading || bookingsLoading || clientRows.length === 0) return <LoadingState label="Chargement du client…" />;
  const client = clientRows[0];
  const clientBookings = bookings.filter((b) => b.clientPhone === client.phone);

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
        <Icon name="back" size={15} /> Retour aux clients
      </button>

      <div
        className="bo-hero"
        style={{
          background: 'linear-gradient(135deg,#164A23,#0F3419)',
          borderRadius: 14,
          padding: '26px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600, marginBottom: 4 }}>Client</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>
          {client.name || client.phone}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          {client.phone} {client.email && `· ${client.email}`} · Inscrit le {client.createdAt}
        </div>
      </div>

      <div className="bo-summary-grid" style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Réservations', value: client.bookingCount },
          { label: 'Rappels', value: client.remindersOn ? 'Activés' : 'Désactivés' },
          { label: 'Promotions', value: client.promosOn ? 'Activées' : 'Désactivées' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E7DED0', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(31,46,53,0.06)' }}>
            <div style={{ fontSize: 11.5, color: '#6B6459', fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 800, color: '#164A23' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bo-card" style={cardStyle}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>
          Réservations ({clientBookings.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clientBookings.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucune réservation.</div>}
          {clientBookings.map((b) => {
            const [color, bg] = STATUS_COLORS[b.status];
            return (
              <div key={b.id} style={rowStyle}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>
                    {b.hotelName} · {b.itemLabel}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B6459' }}>{b.createdAt}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#6B6459' }}>{b.total.toLocaleString('fr-FR')} FCFA</span>
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
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
