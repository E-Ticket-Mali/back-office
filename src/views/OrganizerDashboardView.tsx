import { KpiCard } from '../components/KpiCard';
import { getOrganizerDashboard } from '../api/organizerDashboard';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { GREEN, GOLD } from '../theme';
import { HeadlineBar } from '../components/ui';
import { plural } from '../components/uiStyles';
import type { OrganizerEventStatus, ViewId, ViewSection } from '../types';

const STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillons',
  PENDING_APPROVAL: 'En attente de validation',
  APPROVED: 'Validés, à publier',
  PUBLISHED: 'Publiés',
  REJECTED: 'Rejetés',
};

type OrganizerDashboardViewProps = Readonly<{ onNavigate: (view: ViewId, section?: ViewSection) => void }>;

export function OrganizerDashboardView({ onNavigate }: OrganizerDashboardViewProps) {
  const { data: dashRows, loading: dashLoading, error: dashError } = useCollection(() =>
    getOrganizerDashboard().then((d) => [d])
  );
  if (dashLoading) return <LoadingState label="Chargement du tableau de bord…" />;
  if (dashError) return <ErrorState message={dashError} />;

  const dash = dashRows[0];
  if (!dash) return <ErrorState message="Statistiques indisponibles." />;

  const statuses: OrganizerEventStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED'];

  const kpis = [
    ...statuses.map((s) => ({
      label: STATUS_LABEL[s],
      value: dash.eventsByStatus[s] ?? 0,
      sub: 'événement(s)',
      color: s === 'PUBLISHED' ? GREEN : GOLD,
    })),
    { label: 'Billets vendus', value: dash.ticketsSold, sub: 'au total', color: GREEN },
    {
      label: 'Solde disponible',
      value: `${dash.balance.available.toLocaleString('fr-FR')} FCFA`,
      sub: 'après engagements',
      color: GREEN,
    },
    {
      label: 'Revenu net',
      value: `${dash.balance.netRevenue.toLocaleString('fr-FR')} FCFA`,
      sub: 'ventes confirmées moins commission',
      color: GREEN,
    },
  ];

  const published = dash.eventsByStatus.PUBLISHED ?? 0;
  const pendingReview = dash.eventsByStatus.PENDING_APPROVAL ?? 0;
  const rejected = dash.eventsByStatus.REJECTED ?? 0;
  const toPublish = dash.eventsByStatus.APPROVED ?? 0;

  return (
    <div className="bo-page">
      <HeadlineBar
        items={[
          { label: `${plural(published, 'événement')} ${published > 1 ? 'publiés' : 'publié'}`, onClick: () => onNavigate('organizerEvents', 'PUBLISHED') },
          { label: `${plural(dash.ticketsSold, 'billet')} ${dash.ticketsSold > 1 ? 'vendus' : 'vendu'}`, onClick: () => onNavigate('organizerTicketing', 'sales') },
          { label: `${dash.balance.available.toLocaleString('fr-FR')} FCFA disponibles`, onClick: () => onNavigate('organizerFinance') },
          ...(toPublish > 0
            ? [{ label: `${plural(toPublish, 'événement')} à publier`, onClick: () => onNavigate('organizerEvents', 'APPROVED'), highlight: true }]
            : []),
          ...(pendingReview > 0
            ? [{ label: `${pendingReview} en attente de validation`, onClick: () => onNavigate('organizerEvents', 'PENDING_APPROVAL') }]
            : []),
          ...(rejected > 0
            ? [{ label: `${plural(rejected, 'événement')} ${rejected > 1 ? 'rejetés' : 'rejeté'}`, onClick: () => onNavigate('organizerEvents', 'REJECTED'), highlight: true }]
            : []),
        ]}
      />
      <div className="bo-kpi-grid" style={{ display: 'grid', gap: 16, marginBottom: 22 }}>
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} />
        ))}
      </div>

    </div>
  );
}
