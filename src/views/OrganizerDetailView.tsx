import { useState } from 'react';
import {
  approveOrganizer,
  downloadOrganizerDocument,
  getOrganizer,
  reactivateOrganizer,
  rejectOrganizer,
  suspendOrganizer,
} from '../api/organizers';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState } from '../components/LoadingState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import type { AdminOrganizer, AdminOrganizerDocument, OrganizerStatus } from '../types';
import { GOLD, GREEN } from '../theme';

const STATUS_LABEL: Record<OrganizerStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
};

const STATUS_COLOR: Record<OrganizerStatus, [string, string]> = {
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: [GREEN, 'rgba(22,74,35,0.1)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
  SUSPENDED: [GOLD, 'rgba(166,116,29,0.12)'],
};

interface OrganizerDetailViewProps {
  organizer: AdminOrganizer;
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#FAF3EB',
  borderRadius: 8,
};

const bigBtn = (color: string, textColor = '#FAF3EB'): React.CSSProperties => ({
  padding: '10px 18px',
  border: 'none',
  background: color,
  color: textColor,
  borderRadius: 8,
  fontFamily: "'Poppins',sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});

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

const DOCUMENT_LABEL: Record<AdminOrganizerDocument['kind'], string> = {
  NIF: 'Justificatif NIF',
  RCCM: 'Justificatif RCCM',
  ID_PIECE: "Pièce d'identité",
};

export function OrganizerDetailView(props: Readonly<OrganizerDetailViewProps>) {
  const { organizer: initial, onBack } = props;
  const { data: rows, loading, reload } = useCollection(() => getOrganizer(initial.id).then((o) => [o]));
  const { run, banner } = useActionError();
  const [rejecting, setRejecting] = useState(false);

  if (loading || rows.length === 0) return <LoadingState label="Chargement de l'organisateur…" />;
  const organizer = rows[0];
  const [statusColor, statusBg] = STATUS_COLOR[organizer.status];

  const approve = () =>
    run(async () => {
      await approveOrganizer(organizer.id);
      reload();
    });

  const confirmReject = (reason: string) =>
    run(async () => {
      await rejectOrganizer(organizer.id, reason);
      setRejecting(false);
      reload();
    });

  const suspend = () =>
    run(async () => {
      await suspendOrganizer(organizer.id);
      reload();
    });

  const reactivate = () =>
    run(async () => {
      await reactivateOrganizer(organizer.id);
      reload();
    });

  const download = (doc: AdminOrganizerDocument) =>
    run(async () => {
      await downloadOrganizerDocument(organizer.id, doc.id, `${DOCUMENT_LABEL[doc.kind]}-${organizer.name}`);
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
        <Icon name="back" size={15} /> Retour aux organisateurs
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600 }}>Organisateur</span>
          <span
            style={{
              fontFamily: "'Poppins',sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              color: statusColor,
              background: statusBg,
            }}
          >
            {STATUS_LABEL[organizer.status]}
          </span>
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>{organizer.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          {organizer.email} · {organizer.phone} · Inscrit le {organizer.createdAt}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {organizer.status === 'PENDING' && (
            <>
              <button type="button" onClick={approve} style={bigBtn('#164A23')}>
                Approuver
              </button>
              <button type="button" onClick={() => setRejecting(true)} style={bigBtn('#A6341D')}>
                Rejeter
              </button>
            </>
          )}
          {organizer.status === 'APPROVED' && (
            <button type="button" onClick={suspend} style={bigBtn('#A6341D')}>
              Suspendre
            </button>
          )}
          {organizer.status === 'SUSPENDED' && (
            <button type="button" onClick={reactivate} style={bigBtn('#164A23')}>
              Réactiver
            </button>
          )}
        </div>
      </div>

      {organizer.status === 'REJECTED' && organizer.rejectionReason && (
        <div
          style={{
            marginBottom: 20,
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #F5DCD4',
            background: '#FBEDE8',
            color: '#8A2E17',
            fontSize: 13.5,
          }}
        >
          <strong>Motif du rejet :</strong> {organizer.rejectionReason}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Informations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>NIF</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{organizer.nif}</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>RCCM</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{organizer.rccm}</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 12.5, color: '#6B6459' }}>Taux de commission</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{organizer.commissionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Documents ({organizer.documents.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {organizer.documents.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun document fourni.</div>}
            {organizer.documents.map((doc) => (
              <div key={doc.id} style={rowStyle}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2E35' }}>{DOCUMENT_LABEL[doc.kind]}</div>
                  <div style={{ fontSize: 11, color: '#6B6459' }}>
                    {doc.contentType} · Déposé le {doc.uploadedAt}
                  </div>
                </div>
                <button type="button" onClick={() => download(doc)} style={smallBtn('#164A23')}>
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {rejecting && (
        <ConfirmDialog
          title="Rejeter l'organisateur"
          message={`Rejeter l'inscription de ${organizer.name} ?`}
          reasonLabel="Motif du rejet"
          reasonPlaceholder="Expliquez pourquoi cette inscription est rejetée…"
          confirmLabel="Rejeter"
          onConfirm={confirmReject}
          onCancel={() => setRejecting(false)}
        />
      )}
    </div>
  );
}
