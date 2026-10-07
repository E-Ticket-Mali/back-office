import { useState } from 'react';
import { assignStaffToEvent, getAssignedEvents, getOrganizerStaff, unassignStaffFromEvent } from '../api/organizerStaff';
import { getOrganizerEvents } from '../api/organizerEvents';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { CategoryIcon, Icon } from '../components/Icon';
import { cardStyle, inputStyle, mutedText, primaryButtonStyle } from '../components/uiStyles';
import type { OrganizerEventItem, OrganizerStaffAgent } from '../types';

interface AssignmentData {
  agents: OrganizerStaffAgent[];
  /** staffId → ids des événements affectés */
  assigned: Map<string, Set<string>>;
}

async function loadAssignments(): Promise<AssignmentData[]> {
  const agents = await getOrganizerStaff();
  const lists = await Promise.all(agents.map((a) => getAssignedEvents(a.id)));
  const assigned = new Map(agents.map((a, i) => [a.id, new Set(lists[i].map((e) => e.id))]));
  return [{ agents, assigned }];
}

type EventAssignmentCardProps = Readonly<{
  event: OrganizerEventItem;
  agents: OrganizerStaffAgent[];
  assignedAgents: OrganizerStaffAgent[];
  onAssign: (staffId: string) => Promise<void>;
  onUnassign: (staffId: string) => void;
}>;

function EventAssignmentCard({ event, agents, assignedAgents, onAssign, onUnassign }: EventAssignmentCardProps) {
  const [selected, setSelected] = useState('');
  const assignedIds = new Set(assignedAgents.map((a) => a.id));
  const available = agents.filter((a) => !assignedIds.has(a.id));

  return (
    <div className="bo-card" style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
        <CategoryIcon category={event.category} size={18} color="#164A23" />
        {event.name}
      </div>
      <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
        {event.city} · {new Date(event.date).toLocaleDateString('fr-FR')} · {assignedAgents.length} agent(s) affecté(s)
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {assignedAgents.length === 0 && <span style={{ ...mutedText, fontSize: 12.5 }}>Aucun agent : personne ne pourra scanner les billets de cet événement.</span>}
        {assignedAgents.map((agent) => (
          <span
            key={agent.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 6px 4px 12px',
              borderRadius: 999,
              background: 'rgba(22,74,35,0.1)',
              color: '#164A23',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {agent.agentName}
            <button
              type="button"
              onClick={() => onUnassign(agent.id)}
              aria-label={`Retirer ${agent.agentName}`}
              style={{ border: 'none', background: 'transparent', color: '#164A23', cursor: 'pointer', display: 'flex', padding: 2 }}
            >
              <Icon name="close" size={13} />
            </button>
          </span>
        ))}
      </div>

      {available.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 180 }} aria-label="Agent à affecter">
            <option value="">Choisir un agent…</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.agentName} ({a.staffCode})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selected}
            onClick={async () => {
              await onAssign(selected);
              setSelected('');
            }}
            style={{ ...primaryButtonStyle, opacity: selected ? 1 : 0.5 }}
          >
            Affecter
          </button>
        </div>
      )}
    </div>
  );
}

/** ORGANIZER › Agents contrôleurs › Affectations : qui contrôle quel événement, en un écran. */
export function OrganizerAssignmentsView() {
  const { data: events, loading: eventsLoading, error: eventsError } = useCollection(getOrganizerEvents);
  const { data: rows, loading, refreshing, error, reload } = useCollection(loadAssignments);
  const { run, banner } = useActionError();

  if (loading || eventsLoading) return <LoadingState label="Chargement des affectations…" />;
  if (error) return <ErrorState message={error} />;
  if (eventsError) return <ErrorState message={eventsError} />;
  const data = rows[0];
  if (!data) return <ErrorState message="Affectations indisponibles." />;

  // Les brouillons/rejetés ne seront jamais scannés : on propose ce qui est en validation, validé
  // (on peut préparer le contrôle avant de publier) ou publié.
  const assignable = events
    .filter((e) => ['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED'].includes(e.status))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (data.agents.length === 0) {
    return <div className="bo-page" style={mutedText}>Créez d'abord un agent dans « Mes agents » pour pouvoir l'affecter à un événement.</div>;
  }

  return (
    <div className="bo-page">
      {refreshing && <InlineRefreshHint />}
      {banner}
      {assignable.length === 0 && <div style={mutedText}>Aucun événement en validation, validé ou publié.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {assignable.map((event) => (
          <EventAssignmentCard
            key={event.id}
            event={event}
            agents={data.agents}
            assignedAgents={data.agents.filter((a) => data.assigned.get(a.id)?.has(event.id))}
            onAssign={(staffId) =>
              run(async () => {
                await assignStaffToEvent(staffId, event.id);
                reload();
              })
            }
            onUnassign={(staffId) =>
              run(async () => {
                await unassignStaffFromEvent(staffId, event.id);
                reload();
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
