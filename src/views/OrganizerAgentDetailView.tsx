import { useState } from 'react';
import { getOrganizerStaffMember, getAssignedEvents, assignStaffToEvent, unassignStaffFromEvent } from '../api/organizerStaff';
import { getOrganizerEvents } from '../api/organizerEvents';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState } from '../components/LoadingState';
import type { OrganizerEventItem, OrganizerStaffAgent } from '../types';
import { Icon, CategoryIcon } from '../components/Icon';

interface OrganizerAgentDetailViewProps {
  agent: OrganizerStaffAgent;
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

const selectStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13,
  background: '#FFFFFF',
  color: '#1F2E35',
  flex: 1,
};

const smallBtn = (color: string): React.CSSProperties => ({
  padding: '6px 10px',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
});

export function OrganizerAgentDetailView(props: Readonly<OrganizerAgentDetailViewProps>) {
  const { agent: initial, onBack } = props;
  const { data: rows, loading } = useCollection(() => getOrganizerStaffMember(initial.id).then((a) => [a]));
  const { data: events, loading: eventsLoading } = useCollection(getOrganizerEvents);
  const {
    data: assignedEventRefs,
    loading: assignedLoading,
    reload: reloadAssigned,
  } = useCollection(() => getAssignedEvents(initial.id));
  const { run, banner } = useActionError();

  const [selectedEventId, setSelectedEventId] = useState('');

  if (loading || eventsLoading || assignedLoading || rows.length === 0) return <LoadingState label="Chargement de l'agent…" />;
  const agent = rows[0];

  const assignedIds = new Set(assignedEventRefs.map((e) => e.id));
  const assignableEvents = events.filter((e) => !assignedIds.has(e.id));
  const assignedEvents = events.filter((e) => assignedIds.has(e.id));

  const assign = () =>
    run(async () => {
      if (!selectedEventId) throw new Error('Sélectionnez un événement à affecter.');
      await assignStaffToEvent(agent.id, selectedEventId);
      setSelectedEventId('');
      reloadAssigned();
    });

  const unassign = (event: OrganizerEventItem) =>
    run(async () => {
      await unassignStaffFromEvent(agent.id, event.id);
      reloadAssigned();
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
        <Icon name="back" size={15} /> Retour aux agents
      </button>
      {banner}

      <div
        className="bo-hero"
        style={{
          background: 'linear-gradient(135deg,#164A23,#0F3419)',
          borderRadius: 14,
          padding: '26px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600, marginBottom: 4 }}>Agent contrôleur</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>{agent.agentName}</div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          Code contrôleur : {agent.staffCode} · Créé le {agent.createdAt}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="bo-card" style={cardStyle}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>Informations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Code de connexion (app contrôleur)</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{agent.staffCode}</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Compte créé le</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{agent.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="bo-card" style={cardStyle}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>
            Affectation à un événement
          </div>

          {assignableEvents.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={selectStyle}>
                <option value="">Choisir un événement…</option>
                {assignableEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {new Date(e.date).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
              <button type="button" onClick={assign} style={smallBtn('#164A23')}>
                Affecter
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#6B6459', marginBottom: 16 }}>
              {events.length === 0 ? 'Aucun événement disponible.' : 'Tous vos événements sont déjà affectés à cet agent.'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assignedEvents.length === 0 && (
              <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun événement affecté pour le moment.</div>
            )}
            {assignedEvents.map((e) => (
              <div key={e.id} style={rowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CategoryIcon category={e.category} size={16} color="#164A23" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>{e.name}</span>
                  <span style={{ fontSize: 11.5, color: '#6B6459' }}>{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <button type="button" onClick={() => unassign(e)} style={smallBtn('#A6341D')}>
                  Désaffecter
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
