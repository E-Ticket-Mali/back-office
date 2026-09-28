import { useState } from 'react';
import { cancelBooking, getBooking } from '../api/bookings';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState } from '../components/LoadingState';
import type { AdminBooking, BookingStatus } from '../types';

interface BookingDetailViewProps {
  booking: AdminBooking;
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

export function BookingDetailView(props: Readonly<BookingDetailViewProps>) {
  const { booking: initial, onBack } = props;
  const { data: rows, loading, reload } = useCollection(() => getBooking(initial.id).then((b) => [b]));
  const [cancelling, setCancelling] = useState(false);
  const { run, banner } = useActionError();

  if (loading || rows.length === 0) return <LoadingState label="Chargement de la réservation…" />;
  const booking = rows[0];
  const [color, bg] = STATUS_COLORS[booking.status];

  const doCancel = () =>
    run(async () => {
      setCancelling(true);
      try {
        await cancelBooking(booking.id);
        reload();
      } finally {
        setCancelling(false);
      }
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
        ← Retour aux réservations
      </button>
      {banner}

      <div
        className="bo-hero bo-hero-between"
        style={{
          background: 'linear-gradient(135deg,#164A23,#0F3419)',
          borderRadius: 14,
          padding: '26px 28px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600, marginBottom: 4 }}>
            {booking.kind === 'HOTEL' ? 'Réservation hôtel' : 'Réservation événement'}
          </div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 24, fontWeight: 800, color: '#FAF3EB' }}>
            {booking.hotelName} · {booking.itemLabel}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
            {booking.clientName} · {booking.clientPhone}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div
            style={{
              fontFamily: "'Poppins',sans-serif",
              fontSize: 12.5,
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: 999,
              color,
              background: bg,
            }}
          >
            {STATUS_LABEL[booking.status]}
          </div>
          {booking.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={doCancel}
              disabled={cancelling}
              style={{
                padding: '7px 14px',
                border: '1.5px solid #FAF3EB',
                background: 'transparent',
                color: '#FAF3EB',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: cancelling ? 'not-allowed' : 'pointer',
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              {cancelling ? 'Annulation…' : 'Annuler la réservation'}
            </button>
          )}
        </div>
      </div>

      <div className="bo-detail-grid" style={{ display: 'grid', gap: 18 }}>
        <div className="bo-card" style={cardStyle}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>Détails</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {booking.kind === 'HOTEL' ? (
              <>
                <div style={rowStyle}>
                  <span style={{ fontSize: 12.5, color: '#6B6459' }}>Arrivée</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.checkIn}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: 12.5, color: '#6B6459' }}>Départ</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.checkOut}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: 12.5, color: '#6B6459' }}>Nuits</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.nights}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: 12.5, color: '#6B6459' }}>Voyageurs</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.guests}</span>
                </div>
              </>
            ) : (
              <>
                <div style={rowStyle}>
                  <span style={{ fontSize: 12.5, color: '#6B6459' }}>Date de l'événement</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.eventDate}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: 12.5, color: '#6B6459' }}>Quantité</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.qty}</span>
                </div>
              </>
            )}
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Créée le</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="bo-card" style={cardStyle}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>Paiement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Méthode</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.paymentMethod}</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Sous-total</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.subtotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Frais</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{booking.fee.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div style={{ ...rowStyle, background: '#DCE7DD' }}>
              <span style={{ fontSize: 12.5, color: '#0F3419', fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0F3419' }}>{booking.total.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
