import { useEffect, useState } from 'react';
import { getEvents, getEventStats, getEventTickets } from '../api/events';
import { UnauthorizedError } from '../api/http';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/ui';
import { cardStyle, formatDateTime, inputStyle, mutedText } from '../components/uiStyles';
import { GOLD, GREEN } from '../theme';
import type { EventStats, TicketManifestEntry } from '../types';

interface ManifestState {
  eventId: string;
  tickets: TicketManifestEntry[];
  stats: EventStats;
}

/** ADMIN › Activité › Billets & Manifestes : manifeste nominatif de n'importe quel événement de la plateforme. */
export function AdminTicketsView() {
  const { data: events, loading, error } = useCollection(() => getEvents());
  const [selectedId, setSelectedId] = useState('');
  const [manifest, setManifest] = useState<ManifestState | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Présélectionne le premier événement publié (sinon le premier tout court).
  const defaultId = (events.find((e) => e.status === 'PUBLISHED') ?? events[0])?.id ?? '';
  const eventId = selectedId || defaultId;

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setManifestError(null);
    Promise.all([getEventTickets(eventId), getEventStats(eventId)])
      .then(([tickets, stats]) => {
        if (!cancelled) setManifest({ eventId, tickets, stats });
      })
      .catch((e: unknown) => {
        if (cancelled || e instanceof UnauthorizedError) return;
        setManifestError(e instanceof Error ? e.message : 'Erreur de chargement du manifeste');
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) return <LoadingState label="Chargement des événements…" />;
  if (error) return <ErrorState message={error} />;
  if (events.length === 0) return <div className="bo-page" style={mutedText}>Aucun événement sur la plateforme.</div>;

  const current = manifest && manifest.eventId === eventId ? manifest : null;
  const q = query.trim().toLocaleLowerCase('fr-FR');
  const visibleTickets = (current?.tickets ?? []).filter(
    (t) => !q || `${t.code} ${t.holder} ${t.type}`.toLocaleLowerCase('fr-FR').includes(q),
  );

  return (
    <div className="bo-page">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <select value={eventId} onChange={(e) => setSelectedId(e.target.value)} style={{ ...inputStyle, minWidth: 260 }} aria-label="Événement">
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} — {new Date(ev.date).toLocaleDateString('fr-FR')}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Rechercher un code, un porteur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
      </div>

      {manifestError && <ErrorState message={manifestError} />}
      {!manifestError && !current && <LoadingState label="Chargement du manifeste…" />}

      {current && (
        <>
          <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
            <KpiCard label="Billets émis" value={current.stats.totalTickets} sub="au total" color={GREEN} />
            <KpiCard label="Billets scannés" value={current.stats.scanned} sub={`/${current.stats.totalTickets}`} color={GOLD} />
            <KpiCard label="Scans rejetés" value={current.stats.used + current.stats.invalid} sub="doublons + invalides" color={GOLD} />
          </div>

          <div className="bo-card" style={cardStyle}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Manifeste ({visibleTickets.length})
            </div>
            {visibleTickets.length === 0 && <div style={mutedText}>Aucun billet.</div>}
            <div style={{ display: 'grid', gap: 6 }}>
              {visibleTickets.map((t) => (
                <div
                  key={t.code}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(120px,1fr) 110px minmax(120px,1fr) 170px',
                    gap: 10,
                    alignItems: 'center',
                    padding: '9px 12px',
                    background: '#FAF3EB',
                    borderRadius: 7,
                    fontSize: 12.5,
                  }}
                >
                  <strong style={{ fontFamily: 'monospace' }}>{t.code}</strong>
                  <span>{t.type}</span>
                  <span>{t.holder}</span>
                  {t.used ? (
                    <StatusBadge label={`Scanné ${formatDateTime(t.usedAt)}`} color={GOLD} bg="rgba(166,116,29,0.12)" />
                  ) : (
                    <StatusBadge label="Non scanné" color={GREEN} bg="rgba(22,74,35,0.1)" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
