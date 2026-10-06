import { KpiCard } from '../components/KpiCard';
import { getDashboardStats } from '../api/dashboard';
import { getBookings } from '../api/bookings';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { GREEN, GOLD } from '../theme';
import { getEvents } from '../api/events';
import { getOrganizers } from '../api/organizers';
import { getAdminPayoutRequests } from '../api/payouts';
import { HeadlineBar } from '../components/ui';
import { plural } from '../components/uiStyles';
import type { BookingStatus, ViewId, ViewSection } from '../types';

const STATUS_LABEL: Record<BookingStatus, string> = { CONFIRMED: 'Confirmée', PENDING: 'En attente', CANCELLED: 'Annulée' };
const STATUS_COLORS: Record<BookingStatus, [string, string]> = {
  CONFIRMED: ['#0F9430', 'rgba(20,181,58,0.12)'],
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  CANCELLED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

function useDashboardStats() {
  return useCollection(async () => {
    const stats = await getDashboardStats();
    return [stats];
  });
}

/** Ce qui demande une action de l'ADMIN — affiché en tête, avant les KPI. */
async function loadAttention() {
  const [events, pendingOrganizers, pendingPayouts] = await Promise.all([
    getEvents(),
    getOrganizers('PENDING'),
    getAdminPayoutRequests('PENDING'),
  ]);
  return [
    {
      published: events.filter((e) => e.status === 'PUBLISHED').length,
      pendingEvents: events.filter((e) => e.status === 'PENDING_APPROVAL').length,
      pendingOrganizers: pendingOrganizers.length,
      pendingPayouts: pendingPayouts.length,
    },
  ];
}

type DashboardViewProps = Readonly<{ onNavigate: (view: ViewId, section?: ViewSection) => void }>;

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { data: statsRows, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: attentionRows } = useCollection(loadAttention);
  const { data: bookings, loading: bookingsLoading, error: bookingsError } = useCollection(getBookings);

  if (statsLoading || bookingsLoading) return <LoadingState label="Chargement du tableau de bord…" />;
  if (statsError) return <ErrorState message={statsError} />;
  if (bookingsError) return <ErrorState message={bookingsError} />;

  const stats = statsRows[0];
  if (!stats) return <ErrorState message="Statistiques indisponibles." />;

  const kpis = [
    { label: 'Hôtels référencés', value: stats.totalHotels, sub: 'actifs', color: GREEN },
    { label: 'Événements', value: stats.totalEvents, sub: `dont ${stats.upcomingEvents} à venir`, color: GREEN },
    { label: 'Clients', value: stats.totalClients, sub: 'inscrits', color: GREEN },
    { label: 'Agents contrôleurs', value: stats.totalStaff, sub: 'actifs', color: GOLD },
    { label: 'Réservations', value: stats.totalBookings, sub: `${stats.confirmedBookings} confirmées`, color: GOLD },
    {
      label: 'Chiffre d’affaires',
      value: `${stats.totalRevenue.toLocaleString('fr-FR')} FCFA`,
      sub: 'réservations confirmées',
      color: GREEN,
    },
    { label: 'Billets scannés', value: stats.ticketsScanned, sub: `/${stats.ticketsIssued} émis`, color: GOLD },
  ];

  const recentBookings = bookings.slice(0, 8);
  const attention = attentionRows[0];

  return (
    <div className="bo-page">
      {attention && (
        <HeadlineBar
          items={[
            { label: `${plural(attention.published, 'événement')} en ligne`, onClick: () => onNavigate('events', 'PUBLISHED') },
            {
              label: `${plural(attention.pendingEvents, 'événement')} à valider`,
              onClick: () => onNavigate('events', 'PENDING_APPROVAL'),
              highlight: attention.pendingEvents > 0,
            },
            {
              label: `${plural(attention.pendingOrganizers, 'organisateur')} en attente`,
              onClick: () => onNavigate('organizersAdmin'),
              highlight: attention.pendingOrganizers > 0,
            },
            {
              label: `${plural(attention.pendingPayouts, 'demande')} de reversement`,
              onClick: () => onNavigate('adminPayouts'),
              highlight: attention.pendingPayouts > 0,
            },
          ]}
        />
      )}
      <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 22 }}>
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} />
        ))}
      </div>

      <div
        className="bo-card bo-dashboard-panel"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7DED0',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
        }}
      >
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          Réservations récentes
        </div>
        <div style={{ fontSize: 13 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              textAlign: 'left',
              color: '#6B6459',
              fontFamily: "'Poppins',sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              padding: '6px 10px',
            }}
          >
            <div style={{ flex: 1.4 }}>Client</div>
            <div style={{ flex: 1.6 }}>Objet</div>
            <div style={{ flex: 0.8 }}>Montant</div>
            <div style={{ flex: 0.8 }}>Statut</div>
          </div>
          {recentBookings.length === 0 && (
            <div style={{ padding: '20px 10px', color: '#6B6459' }}>Aucune réservation pour le moment.</div>
          )}
          {recentBookings.map((b) => {
            const [color, bg] = STATUS_COLORS[b.status];
            return (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  borderTop: '1px solid #E7DED0',
                  padding: '11px 10px',
                }}
              >
                <div style={{ flex: 1.4, fontWeight: 600 }}>{b.clientName}</div>
                <div style={{ flex: 1.6, color: '#6B6459' }}>
                  {b.hotelName} · {b.itemLabel}
                </div>
                <div style={{ flex: 0.8, color: '#6B6459' }}>{b.total.toLocaleString('fr-FR')} FCFA</div>
                <div style={{ flex: 0.8 }}>
                  <span
                    style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 12px',
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
