import { getStaffMember } from '../api/staff';
import { useCollection } from '../hooks/useCollection';
import { LoadingState } from '../components/LoadingState';
import type { StaffAgent } from '../types';
import { Icon } from '../components/Icon';

interface AgentDetailViewProps {
  agent: StaffAgent;
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

export function AgentDetailView(props: Readonly<AgentDetailViewProps>) {
  const { agent: initial, onBack } = props;
  const { data: rows, loading } = useCollection(() => getStaffMember(initial.id).then((a) => [a]));

  if (loading || rows.length === 0) return <LoadingState label="Chargement de l'agent…" />;
  const agent = rows[0];

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
    </div>
  );
}
