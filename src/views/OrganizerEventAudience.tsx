import { useState } from 'react';
import type { Attendee, AudienceBookingStatus, EventSummary } from '../api/organizerAudience';
import { RTable, BookingStatusBadge, CustomerCell, EmptyRow, Gauge, SearchBox, matchesQuery, right, shortDate, td, th } from '../components/AudienceBlocks';
import { KpiCard } from '../components/KpiCard';
import { cardStyle, formatFcfa, mutedText, outlineButtonStyle } from '../components/uiStyles';
import { EVENT_CATEGORY_LABELS } from '../utils/eventLabels';
import type { OrganizerEventItem } from '../types';
import { GOLD, GREEN } from '../theme';

const cardTitle: React.CSSProperties = { fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 14 };
const longDateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' });

/** « dans 12 jours », « aujourd'hui », « terminé » — repère temporel de l'événement. */
function timing(event: OrganizerEventItem): { label: string; color: string } {
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = event.endDate ? new Date(event.endDate).getTime() : start;
  if (now > end && now > start) return { label: 'Terminé', color: '#6B6459' };
  if (now >= start) return { label: 'En cours', color: GREEN };
  const days = Math.ceil((start - now) / 86_400_000);
  return { label: days <= 1 ? 'Dans moins de 24 h' : `Dans ${days} jours`, color: '#1D5C8A' };
}

function duration(event: OrganizerEventItem): string | null {
  if (!event.endDate) return null;
  const minutes = Math.round((new Date(event.endDate).getTime() - new Date(event.date).getTime()) / 60_000);
  if (minutes <= 0) return null;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  return [days ? `${days} j` : '', hours ? `${hours} h` : '', rest ? `${rest} min` : ''].filter(Boolean).join(' ');
}

function Fact({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6B6459', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#1F2E35', fontWeight: 600 }}>{children}</div>
    </div>
  );
}

type OverviewProps = Readonly<{
  event: OrganizerEventItem;
  summary: EventSummary | null;
  recent: Attendee[];
  onOpenAttendees: () => void;
}>;

/** Vue d'ensemble d'un événement : chiffres clés, fiche complète, remplissage par catégorie, dernières inscriptions. */
export function EventOverview({ event, summary, recent, onOpenAttendees }: OverviewProps) {
  const when = timing(event);
  const length = duration(event);
  const sold = summary?.sold ?? 0;
  const capacity = summary?.capacity ?? null;
  const activeTickets = event.tickets.filter((t) => t.active);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }} data-testid="event-kpis">
        <KpiCard label="Inscrits" value={summary?.customers ?? 0} sub={`${summary?.bookings ?? 0} réservation(s)`} color={GREEN} />
        <KpiCard label="Billets vendus" value={sold} sub={capacity == null ? 'capacité illimitée' : `sur ${capacity} places`} color={GOLD} />
        <KpiCard label="Entrées contrôlées" value={summary?.checkedIn ?? 0} sub={sold > 0 ? `${Math.round(((summary?.checkedIn ?? 0) / sold) * 100)} % des billets` : 'aucun billet vendu'} color="#1D5C8A" />
        <KpiCard label="Ventes brutes" value={formatFcfa(summary?.grossRevenue ?? 0)} sub={`net : ${formatFcfa(summary?.netRevenue ?? 0)}`} color="#7A3E9D" />
      </div>

      <div className="bo-card" style={{ ...cardStyle, padding: 22 }} data-testid="event-facts">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ ...cardTitle, marginBottom: 0 }}>Fiche de l&apos;événement</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: when.color }}>{when.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          <div style={{ width: 'min(100%,340px)' }}>
            <div style={{ aspectRatio: '16 / 9', borderRadius: 10, border: '1.5px solid #E7DED0', background: '#FAF3EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6B6459' }}>
              {event.coverUrl ? <img src={event.coverUrl} alt="Couverture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Aucune couverture'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 260, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px 22px', alignContent: 'start' }}>
            <Fact label="Début">{longDateTime(event.date)}</Fact>
            <Fact label="Fin">{event.endDate ? longDateTime(event.endDate) : 'Non précisée'}</Fact>
            {length && <Fact label="Durée">{length}</Fact>}
            <Fact label="Lieu">{event.location}</Fact>
            <Fact label="Ville">{event.city}</Fact>
            <Fact label="Catégorie">{EVENT_CATEGORY_LABELS[event.category] ?? event.category}</Fact>
            <Fact label="Capacité totale">{capacity == null ? 'Illimitée' : `${capacity} places`}</Fact>
            <Fact label="Places restantes">{capacity == null ? '—' : Math.max(0, capacity - sold)}</Fact>
            {event.createdAt && <Fact label="Créé le">{shortDate(event.createdAt)}</Fact>}
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6B6459', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Description</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#1F2E35', whiteSpace: 'pre-wrap' }}>{event.desc || 'Aucune description.'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 }}>
        <div className="bo-card" style={{ ...cardStyle, padding: 22 }}>
          <div style={cardTitle}>Remplissage par catégorie</div>
          {activeTickets.length === 0 && <div style={mutedText}>Aucune catégorie de billet active.</div>}
          <div style={{ display: 'grid', gap: 14 }}>
            {activeTickets.map((t) => (
              <div key={t.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ color: '#6B6459' }}>
                    {t.sold} {t.capacity == null ? 'vendu(s) · illimité' : `/ ${t.capacity}`}
                  </span>
                </div>
                {t.capacity != null && <Gauge value={t.sold} max={t.capacity} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bo-card" style={{ ...cardStyle, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ ...cardTitle, marginBottom: 0 }}>Dernières inscriptions</div>
            <button type="button" style={{ ...outlineButtonStyle, padding: '6px 12px', fontSize: 12.5 }} onClick={onOpenAttendees}>
              Voir tous les inscrits
            </button>
          </div>
          {recent.length === 0 && <div style={mutedText}>Aucune inscription pour le moment.</div>}
          <div style={{ display: 'grid', gap: 12 }}>
            {recent.map((a) => (
              <div key={a.bookingId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <CustomerCell name={a.customerName} phone={a.phone} />
                <div style={{ textAlign: 'right', fontSize: 12.5, color: '#6B6459' }}>
                  <div style={{ fontWeight: 600, color: '#1F2E35' }}>
                    {a.qty} × {a.category ?? 'Billet'}
                  </div>
                  {shortDate(a.bookedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type StatusFilter = 'ALL' | AudienceBookingStatus;
const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'CONFIRMED', label: 'Confirmées' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'CANCELLED', label: 'Annulées' },
];

type AttendeesProps = Readonly<{
  attendees: Attendee[];
  onOpenCustomer: (customerId: string) => void;
  onExport: () => void;
}>;

/** Liste des inscrits d'un événement : recherche, filtre par statut, export, accès à la fiche client. */
export function AttendeesTab({ attendees, onOpenCustomer, onExport }: AttendeesProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const rows = attendees.filter((a) => (status === 'ALL' || a.status === status) && matchesQuery(query, a.customerName, a.phone, a.email, a.category));

  return (
    <div className="bo-card" style={{ ...cardStyle, padding: 22 }} data-testid="attendees-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ ...cardTitle, marginBottom: 0 }}>
          Clients inscrits <span style={{ color: '#6B6459', fontWeight: 600 }}>({rows.length})</span>
        </div>
        <button type="button" style={outlineButtonStyle} onClick={onExport}>
          Exporter la liste (CSV)
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un inscrit (nom, téléphone, e-mail)" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={status === f.id}
              onClick={() => setStatus(f.id)}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1.5px solid ${status === f.id ? '#164A23' : '#E7DED0'}`,
                background: status === f.id ? '#164A23' : '#FFFFFF',
                color: status === f.id ? '#FAF3EB' : '#4F5048',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <RTable style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E7DED0' }}>
              <th style={th}>Client</th>
              <th style={th}>Catégorie</th>
              <th style={{ ...th, ...right }}>Billets</th>
              <th style={{ ...th, ...right }}>Montant</th>
              <th style={th}>Statut</th>
              <th style={th}>Entrées</th>
              <th style={th}>Réservé le</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={7}>{attendees.length === 0 ? 'Aucun inscrit pour le moment.' : 'Aucun inscrit ne correspond à la recherche.'}</EmptyRow>}
            {rows.map((a) => (
              <tr key={a.bookingId} onClick={() => onOpenCustomer(a.customerId)} style={{ borderBottom: '1px solid #F1EADF', cursor: 'pointer' }} title="Ouvrir la fiche client">
                <td style={td}>
                  <CustomerCell name={a.customerName} phone={a.phone} email={a.email} />
                </td>
                <td style={td}>{a.category ?? '—'}</td>
                <td style={{ ...td, ...right }}>{a.qty}</td>
                <td style={{ ...td, ...right, fontWeight: 600 }}>{formatFcfa(a.amount)}</td>
                <td style={td}>
                  <BookingStatusBadge status={a.status} />
                </td>
                <td style={td}>
                  {a.checkedIn} / {a.qty}
                </td>
                <td style={td}>{shortDate(a.bookedAt)}</td>
              </tr>
            ))}
          </tbody>
        </RTable>
      </div>
    </div>
  );
}
