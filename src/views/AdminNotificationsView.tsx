import { getEvents } from '../api/events';
import { getOrganizers } from '../api/organizers';
import { getAdminPayoutRequests } from '../api/payouts';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { Icon, type IconName } from '../components/Icon';
import { cardStyle, formatDateTime, formatFcfa, mutedText, outlineButtonStyle } from '../components/uiStyles';
import type { ViewId, ViewSection } from '../types';

interface AttentionItem {
  key: string;
  icon: IconName;
  kind: string;
  title: string;
  body: string;
  /** Absent quand le backend n'expose pas la date de soumission (événements). */
  time: string | null;
  target: ViewId;
  section?: string;
  actionLabel: string;
}

/** Le backend n'expose pas (encore) de flux de notifications ADMIN : on dérive ici tout ce qui
 * attend une décision de l'administrateur à partir des files d'attente existantes. */
async function loadAttentionItems(): Promise<AttentionItem[]> {
  const [organizers, events, payouts] = await Promise.all([
    getOrganizers('PENDING'),
    getEvents('PENDING_APPROVAL'),
    getAdminPayoutRequests('PENDING'),
  ]);
  const items: AttentionItem[] = [
    ...organizers.map((o) => ({
      key: `org-${o.id}`,
      icon: 'organizer' as const,
      kind: 'Inscription organisateur',
      title: o.name,
      body: `Nouveau compte organisateur à valider (${o.email}). Vérifiez les pièces NIF / RCCM.`,
      time: o.createdAt,
      target: 'organizersAdmin' as const,
      actionLabel: 'Examiner',
    })),
    ...events.map((e) => ({
      key: `ev-${e.id}`,
      icon: 'event' as const,
      kind: 'Événement soumis',
      title: e.name,
      body: `Événement du ${new Date(e.date).toLocaleDateString('fr-FR')} à ${e.city} en attente de validation.`,
      time: null,
      target: 'events' as const,
      section: 'PENDING_APPROVAL',
      actionLabel: 'Valider / rejeter',
    })),
    ...payouts.map((p) => ({
      key: `pay-${p.id}`,
      icon: 'wallet' as const,
      kind: 'Demande de reversement',
      title: p.organizerName,
      body: `Demande de ${formatFcfa(p.amount)} à approuver ou refuser.`,
      time: p.requestedAt,
      target: 'adminPayouts' as const,
      actionLabel: 'Traiter',
    })),
  ];
  return items;
}

type AdminNotificationsViewProps = Readonly<{ onNavigate: (view: ViewId, section?: ViewSection) => void }>;

/** ADMIN › Notifications : ce qui nécessite une action de l'administrateur. */
export function AdminNotificationsView({ onNavigate }: AdminNotificationsViewProps) {
  const { data: items, loading, error } = useCollection(loadAttentionItems);

  if (loading) return <LoadingState label="Chargement des notifications…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="bo-page">
      <div style={{ ...mutedText, marginBottom: 14 }}>
        {items.length === 0 ? 'Rien à traiter pour le moment.' : `${items.length} élément(s) en attente d'une décision.`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <article key={item.key} className="bo-card" style={{ ...cardStyle, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(22,74,35,0.1)',
                color: '#164A23',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={item.icon} size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{item.title}</strong>
                {item.time && <span style={{ ...mutedText, fontSize: 11.5 }}>{formatDateTime(item.time)}</span>}
              </div>
              <div style={{ color: '#164A23', fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>{item.kind}</div>
              <p style={{ color: '#4F5048', fontSize: 13, lineHeight: 1.5, margin: '6px 0 0' }}>{item.body}</p>
            </div>
            <button type="button" style={{ ...outlineButtonStyle, flexShrink: 0 }} onClick={() => onNavigate(item.target, item.section ?? null)}>
              {item.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
