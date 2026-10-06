import { useEffect, useState } from 'react';
import { getEvents, getEventScanRecords, getEventStats } from '../api/events';
import { UnauthorizedError } from '../api/http';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/ui';
import { cardStyle, formatDateTime, mutedText } from '../components/uiStyles';
import { GOLD, GREEN } from '../theme';
import type { AdminScanRecord, EventItem, EventStats, ScanStatus } from '../types';

interface EventScanSummary {
  event: EventItem;
  stats: EventStats;
}

const SCAN_LABEL: Record<ScanStatus, string> = { VALID: 'Valide', USED: 'Déjà utilisé', INVALID: 'Invalide' };
const SCAN_COLOR: Record<ScanStatus, [string, string]> = {
  VALID: [GREEN, 'rgba(22,74,35,0.1)'],
  USED: ['#9A7800', 'rgba(252,209,22,0.2)'],
  INVALID: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

/** Suivi global des scans : seuls les événements publiés peuvent être contrôlés en porte. */
async function loadSummaries(): Promise<EventScanSummary[]> {
  const events = (await getEvents('PUBLISHED')).sort((a, b) => b.date.localeCompare(a.date));
  const stats = await Promise.all(events.map((e) => getEventStats(e.id)));
  return events.map((event, i) => ({ event, stats: stats[i] }));
}

const ROW_GRID = 'minmax(160px,1.4fr) 100px 90px 90px 90px 90px';

/** ADMIN › Activité › Scans : taux de contrôle par événement + journal des scans. */
export function AdminScansView() {
  const { data: summaries, loading, error } = useCollection(loadSummaries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [records, setRecords] = useState<{ eventId: string; rows: AdminScanRecord[] } | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setRecordsError(null);
    getEventScanRecords(selectedId)
      .then((rows) => {
        if (!cancelled) setRecords({ eventId: selectedId, rows });
      })
      .catch((e: unknown) => {
        if (cancelled || e instanceof UnauthorizedError) return;
        setRecordsError(e instanceof Error ? e.message : 'Erreur de chargement du journal');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (loading) return <LoadingState label="Chargement des scans…" />;
  if (error) return <ErrorState message={error} />;

  const totals = summaries.reduce(
    (acc, s) => ({
      issued: acc.issued + s.stats.totalTickets,
      controlled: acc.controlled + s.stats.scanned,
      duplicates: acc.duplicates + s.stats.used,
      invalid: acc.invalid + s.stats.invalid,
      scans: acc.scans + s.stats.valid + s.stats.used + s.stats.invalid,
    }),
    { issued: 0, controlled: 0, duplicates: 0, invalid: 0, scans: 0 },
  );
  const rate = totals.issued > 0 ? Math.round((totals.controlled / totals.issued) * 100) : 0;
  const selected = summaries.find((s) => s.event.id === selectedId) ?? null;
  const currentRecords = records && records.eventId === selectedId ? records.rows : null;

  return (
    <div className="bo-page">
      <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
        <KpiCard label="Scans effectués" value={totals.scans} sub="toutes portes" color={GREEN} />
        <KpiCard label="Billets contrôlés" value={totals.controlled} sub={`/${totals.issued} émis`} color={GREEN} />
        <KpiCard label="Taux de contrôle" value={`${rate} %`} sub="billets émis" color={GOLD} />
        <KpiCard label="Rejets" value={totals.duplicates + totals.invalid} sub={`dont ${totals.duplicates} doublons`} color={GOLD} />
      </div>

      <div className="bo-card" style={{ ...cardStyle, marginBottom: 18 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Par événement publié
        </div>
        {summaries.length === 0 && <div style={mutedText}>Aucun événement publié.</div>}
        {summaries.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 10, padding: '0 12px 6px', ...mutedText, fontSize: 11.5, fontWeight: 700 }}>
            <span>ÉVÉNEMENT</span>
            <span>DATE</span>
            <span>ÉMIS</span>
            <span>CONTRÔLÉS</span>
            <span>REJETS</span>
            <span>TAUX</span>
          </div>
        )}
        <div style={{ display: 'grid', gap: 6 }}>
          {summaries.map(({ event, stats }) => {
            const active = event.id === selectedId;
            const eventRate = stats.totalTickets > 0 ? Math.round((stats.scanned / stats.totalTickets) * 100) : 0;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedId(active ? null : event.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: ROW_GRID,
                  gap: 10,
                  alignItems: 'center',
                  padding: '9px 12px',
                  background: active ? 'rgba(22,74,35,0.1)' : '#FAF3EB',
                  border: active ? '1px solid #164A23' : '1px solid transparent',
                  borderRadius: 7,
                  fontSize: 12.5,
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#1F2E35',
                }}
              >
                <strong>{event.name}</strong>
                <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                <span>{stats.totalTickets}</span>
                <span>{stats.scanned}</span>
                <span>{stats.used + stats.invalid}</span>
                <span>{eventRate} %</span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="bo-card" style={cardStyle}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Journal des scans — {selected.event.name}
          </div>
          {recordsError && <ErrorState message={recordsError} />}
          {!recordsError && !currentRecords && <LoadingState label="Chargement du journal…" />}
          {currentRecords && currentRecords.length === 0 && <div style={mutedText}>Aucun scan pour cet événement.</div>}
          <div style={{ display: 'grid', gap: 6 }}>
            {currentRecords?.map((r, i) => (
              <div
                key={`${r.code}-${r.time}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px,1fr) 130px minmax(120px,1fr) 170px',
                  gap: 10,
                  alignItems: 'center',
                  padding: '9px 12px',
                  background: '#FAF3EB',
                  borderRadius: 7,
                  fontSize: 12.5,
                }}
              >
                <strong style={{ fontFamily: 'monospace' }}>{r.code}</strong>
                <StatusBadge label={SCAN_LABEL[r.status]} color={SCAN_COLOR[r.status][0]} bg={SCAN_COLOR[r.status][1]} />
                <span>{r.staffName}</span>
                <span style={mutedText}>{formatDateTime(r.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
