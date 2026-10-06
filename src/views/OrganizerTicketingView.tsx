import { exportManifest, getOrganizerEvents } from '../api/organizerEvents';
import { getOrganizerDashboard } from '../api/organizerDashboard';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { CategoryIcon, Icon } from '../components/Icon';
import { KpiCard } from '../components/KpiCard';
import { cardStyle, formatFcfa, mutedText, outlineButtonStyle, primaryButtonStyle } from '../components/uiStyles';
import { GOLD, GREEN } from '../theme';
import type { TableFilters } from '../hooks/useTableFilters';
import type { EventTicket, OrganizerEventItem } from '../types';

interface OrganizerTicketingViewProps {
  filters: TableFilters;
  /** Onglet : null = Billets & tarifs · 'sales' = Ventes · 'exports' = Manifestes & exports. */
  section?: string | null;
}

const STATUS_LABEL: Record<OrganizerEventItem['status'], string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'En attente',
  APPROVED: 'Validé (non publié)',
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
};

/** Vendus = capacité − restants ; inconnu (null) pour un tarif à capacité illimitée,
 * le backend n'exposant pas de compteur de ventes par type de billet. */
function soldCount(ticket: EventTicket): number | null {
  if (ticket.capacity == null) return null;
  return Math.max(0, ticket.capacity - (ticket.remaining ?? 0));
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  alignItems: 'center',
  padding: '9px 12px',
  background: '#FAF3EB',
  borderRadius: 7,
  fontSize: 12.5,
};

function EventHeader({ event, action }: Readonly<{ event: OrganizerEventItem; action?: React.ReactNode }>) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
          <CategoryIcon category={event.category} size={18} color="#164A23" />
          {event.name}
        </div>
        <div style={{ marginTop: 5, ...mutedText, fontSize: 12 }}>
          {event.city} · {new Date(event.date).toLocaleDateString('fr-FR')} · {STATUS_LABEL[event.status]}
        </div>
      </div>
      {action}
    </div>
  );
}

function PricingSection({ events }: Readonly<{ events: OrganizerEventItem[] }>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {events.map((event) => (
        <div key={event.id} className="bo-card" style={cardStyle}>
          <EventHeader event={event} />
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {event.tickets.length === 0 && <div style={{ ...mutedText, fontSize: 12.5 }}>Aucun type de billet configuré.</div>}
            {event.tickets.map((ticket) => (
              <div key={ticket.id} style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr 1fr' }}>
                <strong>{ticket.type}</strong>
                <span>{formatFcfa(ticket.price)}</span>
                <span>{ticket.capacity == null ? 'Capacité illimitée' : `${ticket.remaining ?? 0}/${ticket.capacity} restant(s)`}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesSection({ events, ticketsSold }: Readonly<{ events: OrganizerEventItem[]; ticketsSold: number | null }>) {
  let knownRevenue = 0;
  const salesEvents = events.filter((e) => e.status === 'PUBLISHED');
  for (const event of salesEvents) {
    for (const ticket of event.tickets) knownRevenue += (soldCount(ticket) ?? 0) * ticket.price;
  }
  const hasUnlimited = salesEvents.some((e) => e.tickets.some((t) => t.capacity == null));

  return (
    <>
      <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
        <KpiCard label="Billets vendus" value={ticketsSold ?? '—'} sub="tous événements" color={GREEN} />
        <KpiCard label="Événements en vente" value={salesEvents.length} sub="publiés" color={GOLD} />
        <KpiCard label="Ventes brutes (tarifs limités)" value={formatFcfa(knownRevenue)} sub="avant commission" color={GREEN} />
      </div>
      {hasUnlimited && (
        <div style={{ ...mutedText, fontSize: 12, marginBottom: 12 }}>
          Les ventes par tarif ne sont détaillées que pour les tarifs à capacité limitée ; le total « Billets vendus » couvre tous les tarifs.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {salesEvents.length === 0 && <div style={mutedText}>Aucun événement publié.</div>}
        {salesEvents.map((event) => (
          <div key={event.id} className="bo-card" style={cardStyle}>
            <EventHeader event={event} />
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {event.tickets.map((ticket) => {
                const sold = soldCount(ticket);
                const pct = sold != null && ticket.capacity ? Math.round((sold / ticket.capacity) * 100) : null;
                return (
                  <div key={ticket.id} style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr 1fr 1.2fr' }}>
                    <strong>{ticket.type}</strong>
                    <span>{sold == null ? '— vendus' : `${sold} vendu(s)`}</span>
                    <span>{sold == null ? '—' : formatFcfa(sold * ticket.price)}</span>
                    {pct == null ? (
                      <span style={mutedText}>Capacité illimitée</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#E7DED0', overflow: 'hidden' }}>
                          <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: '#164A23' }} />
                        </span>
                        {pct} %
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ExportsSection({ events, onExport, onExportAll }: Readonly<{
  events: OrganizerEventItem[];
  onExport: (id: string) => void;
  onExportAll: () => void;
}>) {
  const exportable = events.filter((e) => e.status === 'PUBLISHED');
  return (
    <div className="bo-card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700 }}>Manifestes</div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            Un fichier CSV par événement publié : chaque billet émis (code, tarif, porteur, statut de scan) — la liste remise aux agents.
          </div>
        </div>
        <button type="button" disabled={exportable.length === 0} onClick={onExportAll} style={{ ...primaryButtonStyle, opacity: exportable.length === 0 ? 0.5 : 1 }}>
          Tout télécharger ({exportable.length})
        </button>
      </div>
      {exportable.length === 0 && <div style={mutedText}>Aucun événement publié à exporter.</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {exportable.map((event) => (
          <div key={event.id} style={{ ...rowStyle, gridTemplateColumns: '1fr auto' }}>
            <span>
              <strong>{event.name}</strong> <span style={mutedText}>· {new Date(event.date).toLocaleDateString('fr-FR')}</span>
            </span>
            <button type="button" onClick={() => onExport(event.id)} style={{ ...outlineButtonStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="download" size={14} /> Télécharger
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ORGANIZER › Billetterie : tarifs, ventes, manifestes et exports de ses propres événements. */
export function OrganizerTicketingView({ filters, section = null }: Readonly<OrganizerTicketingViewProps>) {
  const { data: events, loading, error } = useCollection(getOrganizerEvents);
  const { data: dashRows } = useCollection(() => getOrganizerDashboard().then((d) => [d]));
  const { run, banner } = useActionError();

  if (loading) return <LoadingState label="Chargement de la billetterie…" />;
  if (error) return <ErrorState message={error} />;

  const query = filters.search.trim().toLocaleLowerCase('fr-FR');
  const visibleEvents = events.filter(
    (event) => !query || `${event.name} ${event.city} ${event.location}`.toLocaleLowerCase('fr-FR').includes(query),
  );

  const onExport = (id: string) => run(() => exportManifest(id));
  const onExportAll = () =>
    run(async () => {
      // Séquentiel : certains navigateurs bloquent plusieurs téléchargements simultanés.
      for (const event of visibleEvents.filter((e) => e.status === 'PUBLISHED')) await exportManifest(event.id);
    });

  let content: React.ReactNode;
  if (section === 'sales') content = <SalesSection events={visibleEvents} ticketsSold={dashRows[0]?.ticketsSold ?? null} />;
  else if (section === 'exports') content = <ExportsSection events={visibleEvents} onExport={onExport} onExportAll={onExportAll} />;
  else content = <PricingSection events={visibleEvents} />;

  return (
    <div className="bo-page">
      {banner}
      {visibleEvents.length === 0 ? <div style={mutedText}>Aucun événement trouvé.</div> : content}
    </div>
  );
}
