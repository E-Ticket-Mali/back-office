import { useState } from 'react';
import {
  addOrganizerTicketType,
  clearOrganizerEventImage,
  clearOrganizerTicketTypeImage,
  deleteOrganizerTicketType,
  exportManifest,
  getOrganizerEvent,
  setOrganizerEventImagePreset,
  setOrganizerTicketTypeImagePreset,
  submitOrganizerEvent,
  publishOrganizerEvent,
  unpublishOrganizerEvent,
  updateOrganizerTicketType,
  uploadOrganizerEventImage,
  uploadOrganizerTicketTypeImage,
} from '../api/organizerEvents';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { FreePill, TicketTypePill } from '../components/Pill';
import { LoadingState } from '../components/LoadingState';
import { ImagePicker } from '../components/ImagePicker';
import { PublishDialog } from '../components/PublishDialog';
import type { EventTicket, OrganizerEventItem, OrganizerEventStatus, TicketType } from '../types';
import { Icon, CategoryIcon } from '../components/Icon';
import { GOLD, GREEN } from '../theme';

/** Seule une validation en cours verrouille l'événement ; une modification publiée déclenche une nouvelle revue. */
function isOrganizerEventEditable(status: OrganizerEventStatus): boolean {
  return status !== 'PENDING_APPROVAL';
}

interface OrganizerEventDetailViewProps {
  event: OrganizerEventItem;
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

const selectStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1.5px solid #E7DED0',
  borderRadius: 7,
  fontSize: 12,
  background: '#FFFFFF',
  color: '#1F2E35',
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

const TICKET_TYPES: TicketType[] = ['VIP', 'STANDARD', 'EARLY_BIRD'];
const TICKET_LABELS: Record<TicketType, string> = { VIP: 'Billet VIP', STANDARD: 'Billet Standard', EARLY_BIRD: 'Billet Early Bird' };

const STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'En attente de validation',
  APPROVED: 'Validé (non publié)',
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
};

const STATUS_COLOR: Record<OrganizerEventStatus, [string, string]> = {
  DRAFT: [GOLD, 'rgba(166,116,29,0.12)'],
  PENDING_APPROVAL: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: ['#1D5C8A', 'rgba(29,92,138,0.12)'],
  PUBLISHED: [GREEN, 'rgba(22,74,35,0.1)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

export function OrganizerEventDetailView(props: Readonly<OrganizerEventDetailViewProps>) {
  const { event: initialEvent, onBack } = props;
  const { data: eventRows, loading: eventLoading, reload: reloadEvent } = useCollection(() =>
    getOrganizerEvent(initialEvent.id).then((e) => [e])
  );

  const [newType, setNewType] = useState<TicketType>('STANDARD');
  const [newPrice, setNewPrice] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [editingType, setEditingType] = useState<Record<string, string>>({});
  const [publishMode, setPublishMode] = useState<'publish' | 'unpublish' | null>(null);
  const { run, banner } = useActionError();

  if (eventLoading || eventRows.length === 0) {
    return <LoadingState label="Chargement de l'événement…" />;
  }
  const event = eventRows[0];
  const editable = isOrganizerEventEditable(event.status);
  // Soumettre n'a de sens qu'avant validation ; ensuite, l'organisateur publie / dépublie lui-même.
  const canSubmit = (event.status === 'DRAFT' || event.status === 'REJECTED') && event.tickets.length > 0;
  const [statusColor, statusBg] = STATUS_COLOR[event.status];

  const addNewTicketType = () =>
    run(async () => {
      const price = Number(newPrice);
      if (newPrice.trim() === '' || !(price >= 0)) throw new Error('Renseignez un prix (0 pour un billet gratuit).');
      const capacity = newCapacity.trim() === '' ? undefined : Number(newCapacity);
      if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new Error('La capacité doit être un entier d’au moins 1 (laisser vide = illimitée).');
      }
      await addOrganizerTicketType(event.id, { type: newType, price, capacity });
      setNewPrice('');
      setNewCapacity('');
      reloadEvent();
    });

  const startEditType = (tt: EventTicket) => setEditingType((r) => ({ ...r, [tt.id]: String(tt.price) }));

  const saveType = (tt: EventTicket) =>
    run(async () => {
      const price = editingType[tt.id];
      if (!price) return;
      await updateOrganizerTicketType(event.id, tt.id, { price: Number(price) });
      setEditingType((r) => {
        const { [tt.id]: _removed, ...rest } = r;
        return rest;
      });
      reloadEvent();
    });

  const removeType = (tt: EventTicket) =>
    run(async () => {
      await deleteOrganizerTicketType(event.id, tt.id);
      reloadEvent();
    });

  const submitForValidation = () =>
    run(async () => {
      await submitOrganizerEvent(event.id);
      reloadEvent();
    });

  const downloadManifest = () =>
    run(async () => {
      await exportManifest(event.id);
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
        <Icon name="back" size={15} /> Retour aux événements
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
          <span style={{ fontSize: 12, color: 'rgba(250,243,235,0.7)', fontWeight: 600 }}>
            {event.city} · {event.location}
          </span>
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
            {STATUS_LABEL[event.status]}
          </span>
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color: '#FAF3EB' }}>
          <CategoryIcon category={event.category} size={26} /> {event.name}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.75)', marginTop: 4 }}>
          {new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
        </div>
        {event.desc && <div style={{ fontSize: 13, color: 'rgba(250,243,235,0.85)', marginTop: 10 }}>{event.desc}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {canSubmit && (
            <button type="button" onClick={submitForValidation} style={bigBtn('#A6741D')}>
              Soumettre pour validation
            </button>
          )}
          {event.status === 'APPROVED' && (
            <button type="button" onClick={() => setPublishMode('publish')} style={bigBtn('#A6741D')}>
              Publier
            </button>
          )}
          {event.status === 'PUBLISHED' && (
            <button type="button" onClick={() => setPublishMode('unpublish')} style={bigBtn('rgba(250,243,235,0.16)')}>
              Dépublier
            </button>
          )}
          <button type="button" onClick={downloadManifest} style={bigBtn('rgba(250,243,235,0.16)')}>
            Exporter le manifeste
          </button>
        </div>
      </div>

      {event.status === 'REJECTED' && event.rejectionReason && (
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
          <strong>Motif du rejet :</strong> {event.rejectionReason}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Image de l'événement</div>
          {editable ? (
            <ImagePicker
              clearLabel="Revenir au logo de la catégorie"
              imageUrl={event.imageUrl}
              size={140}
              onUpload={(file) => uploadOrganizerEventImage(event.id, file).then(() => reloadEvent())}
              onSelectPreset={(key) => setOrganizerEventImagePreset(event.id, key).then(() => reloadEvent())}
              onClear={() => clearOrganizerEventImage(event.id).then(() => reloadEvent())}
            />
          ) : event.imageUrl ? (
            <img src={event.imageUrl} alt="" style={{ width: 140, height: 140, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: 12.5, color: '#6B6459' }}>Aucune image définie.</div>
          )}
        </div>

        <div className="bo-card" style={cardStyle}>
          <div style={cardTitleStyle}>Types de billets</div>

          {editable ? (
            <div className="bo-compact-form-row" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={newType} onChange={(e) => setNewType(e.target.value as TicketType)} style={selectStyle}>
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TICKET_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Prix en FCFA (0 = gratuit)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ ...selectStyle, flex: 1 }}
              />
              <input
                type="number"
                min={1}
                placeholder="Places (illimité si vide)"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                style={{ ...selectStyle, flex: 1 }}
              />
              <button type="button" onClick={addNewTicketType} style={smallBtn('#164A23')}>
                Ajouter
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#6B6459', marginBottom: 16 }}>
              Cet événement n’est plus modifiable (statut « {STATUS_LABEL[event.status]} »).
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {event.tickets.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun type de billet.</div>}
            {event.tickets.map((tt) => {
              const draft = editingType[tt.id];
              return (
                <div key={tt.id} style={rowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {editable ? (
                      <ImagePicker
                        imageUrl={tt.imageUrl ?? null}
                        size={40}
                        onUpload={(file) => uploadOrganizerTicketTypeImage(event.id, tt.id, file).then(() => reloadEvent())}
                        onSelectPreset={(key) => setOrganizerTicketTypeImagePreset(event.id, tt.id, key).then(() => reloadEvent())}
                        onClear={() => clearOrganizerTicketTypeImage(event.id, tt.id).then(() => reloadEvent())}
                      />
                    ) : (
                      tt.imageUrl && (
                        <img src={tt.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      )
                    )}
                    <TicketTypePill type={tt.type} />
                    {tt.price === 0 && <FreePill />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>{TICKET_LABELS[tt.type]}</span>
                  </div>
                  {editable && draft !== undefined ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={draft}
                        onChange={(e) => setEditingType((r) => ({ ...r, [tt.id]: e.target.value }))}
                        style={{ ...selectStyle, width: 110 }}
                      />
                      <button type="button" onClick={() => saveType(tt)} style={smallBtn('#164A23')}>
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6B6459' }}>
                        {tt.price === 0 ? '0 FCFA' : `${tt.price.toLocaleString('fr-FR')} FCFA`} ·{' '}
                        {tt.capacity == null ? 'illimité' : `${tt.remaining ?? 0}/${tt.capacity} restant(s)`}
                      </span>
                      {editable && (
                        <>
                          <button type="button" onClick={() => startEditType(tt)} style={smallBtn('#164A23')}>
                            Modifier
                          </button>
                          <button type="button" onClick={() => removeType(tt)} style={smallBtn('#A6341D')}>
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {publishMode && (
        <PublishDialog
          mode={publishMode}
          eventName={event.name}
          onCancel={() => setPublishMode(null)}
          onConfirm={async () => {
            if (publishMode === 'publish') await publishOrganizerEvent(event.id);
            else await unpublishOrganizerEvent(event.id);
            setPublishMode(null);
            reloadEvent();
          }}
        />
      )}
    </div>
  );
}
