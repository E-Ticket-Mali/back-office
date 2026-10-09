import { useEffect } from 'react';
import { getOrganizerNotifications, markAllOrganizerNotificationsRead } from '../api/organizerNotifications';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import type { OrganizerNotification } from '../types';

const TYPE_LABEL: Record<string, string> = {
  ORGANIZER_STATUS: 'Statut du compte',
  EVENT_SUBMITTED: 'Événement soumis',
  EVENT_STATUS: 'Décision événement',
  PAYOUT_STATUS: 'Reversement',
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 10,
  padding: 18,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

export function OrganizerNotificationsView() {
  const { data: notifications, loading, error } = useCollection(getOrganizerNotifications);
  const hasUnread = notifications.some((n) => !n.read);

  // Consulter la page vaut lecture : les notifications affichées gardent leur mise en avant
  // « nouvelle » pendant cette visite, et le badge du menu retombe à zéro à la navigation suivante.
  useEffect(() => {
    if (hasUnread) void markAllOrganizerNotificationsRead().catch(() => undefined);
  }, [hasUnread]);

  if (loading) return <LoadingState label="Chargement des notifications…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="bo-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.length === 0 && <div style={{ color: '#6B6459', fontSize: 13 }}>Aucune notification.</div>}
        {notifications.map((notification: OrganizerNotification) => (
          <article
            key={notification.id}
            style={{ ...cardStyle, opacity: notification.read ? 0.72 : 1, borderLeft: notification.read ? undefined : '3px solid #E9A23B' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
              <strong style={{ fontSize: 14 }}>
                {notification.title}
                {!notification.read && (
                  <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: '#A6741D', textTransform: 'uppercase' }}>Nouvelle</span>
                )}
              </strong>
              <span style={{ color: '#6B6459', fontSize: 11.5 }}>{new Date(notification.time).toLocaleString('fr-FR')}</span>
            </div>
            <div style={{ color: '#164A23', fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>
              {TYPE_LABEL[notification.type] ?? notification.type}
            </div>
            <p style={{ color: '#4F5048', fontSize: 13, lineHeight: 1.5, margin: '8px 0 0' }}>{notification.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
