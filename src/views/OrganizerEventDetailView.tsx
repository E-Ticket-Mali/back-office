import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  addOrganizerTicketType,
  clearOrganizerTicketTypeImage,
  exportManifest,
  getOrganizerEvent,
  publishOrganizerEvent,
  setOrganizerTicketTypeImagePreset,
  submitOrganizerEvent,
  unpublishOrganizerEvent,
  updateOrganizerTicketType,
  uploadOrganizerTicketTypeImage,
} from '../api/organizerEvents';
import { getEventAudience } from '../api/organizerAudience';
import { AttendeesTab, EventOverview } from './OrganizerEventAudience';
import { useActionError } from '../hooks/useActionError';
import { useCollection } from '../hooks/useCollection';
import { Icon, CategoryIcon } from '../components/Icon';
import { ImagePicker } from '../components/ImagePicker';
import { KpiCard } from '../components/KpiCard';
import { RTable } from '../components/AudienceBlocks';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { PublishDialog } from '../components/PublishDialog';
import { TicketCategoryModal } from '../components/TicketCategoryModal';
import { Tabs } from '../components/ui';
import { cardStyle, formatFcfa, mutedText, outlineButtonStyle, primaryButtonStyle } from '../components/uiStyles';
import { isOrganizerEventEditable, ORGANIZER_STATUS_LABEL } from '../utils/eventLabels';
import type { EventTicket, OrganizerEventItem, OrganizerEventStatus, ViewId } from '../types';
import { GOLD, GREEN } from '../theme';

const STATUS_COLOR: Record<OrganizerEventStatus, [string, string]> = {
  DRAFT: [GOLD, 'rgba(166,116,29,0.12)'],
  PENDING_APPROVAL: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: ['#1D5C8A', 'rgba(29,92,138,0.12)'],
  PUBLISHED: [GREEN, 'rgba(22,74,35,0.1)'],
  UNPUBLISHED: ['#6B6459', 'rgba(107,100,89,0.14)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

type DetailTab = 'overview' | 'attendees' | 'ticketing' | 'sales' | 'control' | 'finances';
const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'attendees', label: 'Inscrits' },
  { id: 'ticketing', label: 'Billetterie' },
  { id: 'sales', label: 'Ventes de billets' },
  { id: 'control', label: 'Contrôle des billets' },
  { id: 'finances', label: 'Finances' },
];

const cardTitle: React.CSSProperties = { fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, marginBottom: 14 };
const fmtPrice = (price: number) => (price === 0 ? 'Gratuit' : formatFcfa(price));
const totalSold = (tickets: EventTicket[]) => tickets.reduce((n, t) => n + t.sold, 0);
const totalRevenue = (tickets: EventTicket[]) => tickets.reduce((n, t) => n + t.revenue, 0);

type OrganizerEventDetailViewProps = Readonly<{
  eventId: string;
  onNavigateView: (view: ViewId) => void;
  onOpenCustomer: (customerId: string) => void;
}>;

/** Page d'un événement : en-tête (statut, actions) puis onglets Vue d'ensemble, Billetterie, Ventes, Contrôle, Finances. */
export function OrganizerEventDetailView({ eventId, onNavigateView, onOpenCustomer }: OrganizerEventDetailViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { data: rows, loading, error, reload } = useCollection(() => getOrganizerEvent(eventId).then((e) => [e]));
  // Les inscrits alimentent la vue d'ensemble (chiffres, dernières inscriptions) et l'onglet Inscrits.
  const { data: audienceRows } = useCollection(() => getEventAudience(eventId).then((a) => [a]));
  const audience = audienceRows[0] ?? null;
  const [publishMode, setPublishMode] = useState<'publish' | 'unpublish' | null>(null);
  const { run, banner } = useActionError();

  const tabParam = params.get('tab');
  const tab: DetailTab = TABS.some((t) => t.id === tabParam) ? (tabParam as DetailTab) : 'overview';
  const warnings = (location.state as { warnings?: string[] } | null)?.warnings ?? [];

  if (loading) return <LoadingState label="Chargement de l'événement…" />;
  if (error) return <ErrorState message={error} />;
  const event = rows[0];
  if (!event) return <ErrorState message="Événement introuvable." />;

  const editable = isOrganizerEventEditable(event.status);
  const canSubmit = (event.status === 'DRAFT' || event.status === 'REJECTED') && event.tickets.some((t) => t.active);
  const missingCover = event.coverUrl == null;
  const [statusColor, statusBg] = STATUS_COLOR[event.status];
  const tabs = TABS.map((t) => (t.id === 'attendees' && audience ? { ...t, count: audience.attendees.length } : t));
  const openTab = (id: DetailTab) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true, state: location.state });

  return (
    <div className="bo-page">
      <button
        type="button"
        onClick={() => navigate('/organizer/events')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#164A23', cursor: 'pointer', marginBottom: 18, background: 'transparent', border: 'none', padding: 0 }}
      >
        <Icon name="back" size={15} /> Mes événements
      </button>
      {banner}
      {warnings.map((w) => (
        <div key={w} role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(252,209,22,0.18)', color: '#6B5400', fontSize: 13 }}>
          {w}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 24, fontWeight: 800, color: '#1F2E35' }}>
            <CategoryIcon category={event.category} size={24} /> {event.name}
          </div>
          <span style={{ display: 'inline-block', marginTop: 6, fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: statusColor, background: statusBg }}>
            {ORGANIZER_STATUS_LABEL[event.status]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canSubmit && (
            <button type="button" style={primaryButtonStyle} onClick={() => run(async () => { await submitOrganizerEvent(event.id); reload(); })}>
              Soumettre pour validation
            </button>
          )}
          {(event.status === 'APPROVED' || event.status === 'UNPUBLISHED') && (
            <button
              type="button"
              style={{ ...primaryButtonStyle, opacity: missingCover ? 0.5 : 1, cursor: missingCover ? 'not-allowed' : 'pointer' }}
              disabled={missingCover}
              title={missingCover ? "Ajoutez une image de couverture pour publier" : undefined}
              onClick={() => setPublishMode('publish')}
            >
              {event.status === 'UNPUBLISHED' ? 'Republier' : 'Publier'}
            </button>
          )}
          {event.status === 'PUBLISHED' && (
            <button type="button" style={outlineButtonStyle} onClick={() => setPublishMode('unpublish')}>
              Dépublier
            </button>
          )}
          {editable && (
            <button type="button" style={outlineButtonStyle} onClick={() => navigate(`/organizer/events/${event.id}/edit`)}>
              Modifier
            </button>
          )}
        </div>
      </div>

      {event.status === 'REJECTED' && event.rejectionReason && (
        <div style={{ marginBottom: 18, padding: '14px 18px', borderRadius: 10, border: '1px solid #F5DCD4', background: '#FBEDE8', color: '#8A2E17', fontSize: 13.5 }}>
          <strong>Motif du rejet :</strong> {event.rejectionReason}. Corrigez l&apos;événement puis soumettez-le à nouveau.
        </div>
      )}
      {missingCover && event.status !== 'PUBLISHED' && (
        <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 10, background: 'rgba(252,209,22,0.18)', color: '#6B5400', fontSize: 13 }}>
          Aucune image de couverture : elle est requise pour publier l&apos;événement.{' '}
          {editable && (
            <button type="button" onClick={() => navigate(`/organizer/events/${event.id}/edit`)} style={{ background: 'none', border: 'none', color: '#164A23', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Ajouter une couverture
            </button>
          )}
        </div>
      )}

      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true, state: location.state })} />

      {tab === 'overview' && (
        <EventOverview event={event} summary={audience?.summary ?? null} recent={(audience?.attendees ?? []).slice(0, 5)} onOpenAttendees={() => openTab('attendees')} />
      )}
      {tab === 'attendees' && <AttendeesTab attendees={audience?.attendees ?? []} onOpenCustomer={onOpenCustomer} onExport={() => run(() => exportManifest(event.id))} />}
      {tab === 'ticketing' && <TicketingTab event={event} editable={editable} reload={reload} run={run} />}
      {tab === 'sales' && <SalesTab event={event} />}
      {tab === 'control' && <ControlTab event={event} run={run} onOpenAssignments={() => onNavigateView('organizerAssignments')} />}
      {tab === 'finances' && <FinancesTab event={event} onOpenFinance={() => onNavigateView('organizerFinance')} />}

      {publishMode && (
        <PublishDialog
          mode={publishMode}
          eventName={event.name}
          onCancel={() => setPublishMode(null)}
          onConfirm={async () => {
            if (publishMode === 'publish') await publishOrganizerEvent(event.id);
            else await unpublishOrganizerEvent(event.id);
            setPublishMode(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function TicketingTab(props: Readonly<{ event: OrganizerEventItem; editable: boolean; reload: () => void; run: (a: () => Promise<unknown>) => Promise<void> }>) {
  const { event, editable, reload, run } = props;
  const [modal, setModal] = useState<EventTicket | 'new' | null>(null);
  const [toggling, setToggling] = useState<EventTicket | null>(null);
  const activeCount = event.tickets.filter((t) => t.active).length;

  return (
    <div className="bo-card" style={{ ...cardStyle, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={cardTitle}>Billetterie</div>
          <div style={{ ...mutedText, marginTop: -8 }}>
            {event.tickets.length} catégorie(s) de billets{event.tickets.length > activeCount ? ` · ${event.tickets.length - activeCount} désactivée(s)` : ''}
          </div>
        </div>
        {editable && (
          <button type="button" style={primaryButtonStyle} onClick={() => setModal('new')}>
            + Ajouter une catégorie
          </button>
        )}
      </div>
      {!editable && <div style={{ ...mutedText, marginBottom: 14 }}>Cet événement est en cours de validation : la billetterie n&apos;est pas modifiable.</div>}

      <div style={{ display: 'grid', gap: 10 }}>
        {event.tickets.length === 0 && <div style={mutedText}>Aucune catégorie de billet.</div>}
        {event.tickets.map((tt) => (
          <div key={tt.id} style={{ padding: '12px 16px', background: '#FAF3EB', borderRadius: 10, opacity: tt.active ? 1 : 0.75, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {editable ? (
                <ImagePicker
                  imageUrl={tt.imageUrl ?? null}
                  size={40}
                  onUpload={(file) => uploadOrganizerTicketTypeImage(event.id, tt.id, file).then(() => reload())}
                  onSelectPreset={(key) => setOrganizerTicketTypeImagePreset(event.id, tt.id, key).then(() => reload())}
                  onClear={() => clearOrganizerTicketTypeImage(event.id, tt.id).then(() => reload())}
                />
              ) : (
                tt.imageUrl && <img src={tt.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {tt.name}
                  {!tt.active && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#A6341D' }}>Désactivée</span>}
                </div>
                <div style={{ fontSize: 12.5, color: '#6B6459' }}>
                  {fmtPrice(tt.price)} · {tt.capacity == null ? 'places illimitées' : `${tt.capacity} places`} · {tt.sold} vendu(s)
                </div>
                {tt.description && <div style={{ fontSize: 12, color: '#6B6459' }}>{tt.description}</div>}
                {!tt.active && (
                  <div style={{ fontSize: 12, color: '#6B6459', marginTop: 4 }}>
                    Cette catégorie n&apos;est plus disponible à la vente. Les {tt.sold} billet(s) déjà acheté(s) restent valides.
                  </div>
                )}
              </div>
            </div>
            {editable && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={outlineButtonStyle} onClick={() => setModal(tt)}>
                  Modifier
                </button>
                <button type="button" style={{ ...outlineButtonStyle, borderColor: tt.active ? '#A6341D' : '#164A23', color: tt.active ? '#A6341D' : '#164A23' }} onClick={() => (tt.active ? setToggling(tt) : run(async () => { await updateOrganizerTicketType(event.id, tt.id, { active: true }); reload(); }))}>
                  {tt.active ? 'Désactiver' : 'Réactiver'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <TicketCategoryModal
          inline={modal === 'new'}
          title={modal === 'new' ? 'Créer une catégorie de billet' : 'Modifier la catégorie'}
          submitLabel={modal === 'new' ? 'Créer' : 'Enregistrer'}
          initial={modal === 'new' ? undefined : { name: modal.name, price: String(modal.price), capacity: modal.capacity == null ? '' : String(modal.capacity), description: modal.description ?? '' }}
          notice={
            modal !== 'new' && modal.sold > 0
              ? `${modal.sold} billet(s) déjà vendu(s) : le nouveau prix ne s'applique qu'aux ventes futures, et la quantité ne peut pas descendre sous ${modal.sold}.`
              : undefined
          }
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal === 'new') await addOrganizerTicketType(event.id, payload);
            else {
              await updateOrganizerTicketType(event.id, modal.id, {
                name: payload.name,
                price: payload.price,
                capacity: payload.capacity,
                description: payload.description ?? '',
              });
            }
            reload();
          }}
        />
      )}

      {toggling && (
        <Modal title="Désactiver la catégorie" onClose={() => setToggling(null)} size="sm">
          <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 16px' }}>
            <strong>{toggling.name}</strong> ne sera plus disponible à la vente. Les {toggling.sold} billet(s) déjà acheté(s) restent valides.
            Vous pourrez la réactiver à tout moment.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" style={outlineButtonStyle} onClick={() => setToggling(null)}>
              Annuler
            </button>
            <button
              type="button"
              style={{ ...primaryButtonStyle, background: '#A6341D' }}
              onClick={() =>
                run(async () => {
                  await updateOrganizerTicketType(event.id, toggling.id, { active: false });
                  setToggling(null);
                  reload();
                })
              }
            >
              Désactiver
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SalesTab({ event }: Readonly<{ event: OrganizerEventItem }>) {
  const cell: React.CSSProperties = { padding: '10px 12px', fontSize: 13, textAlign: 'right' };
  const head: React.CSSProperties = { ...cell, fontSize: 11.5, color: '#6B6459', fontWeight: 700 };
  return (
    <div className="bo-card" style={{ ...cardStyle, padding: 22, overflowX: 'auto' }}>
      <div style={cardTitle}>Ventes de billets</div>
      <RTable style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E7DED0' }}>
            <th style={{ ...head, textAlign: 'left' }}>Catégorie</th>
            <th style={head}>Tarif actuel</th>
            <th style={head}>Vendus</th>
            <th style={head}>Remplissage</th>
            <th style={head}>Ventes brutes</th>
          </tr>
        </thead>
        <tbody>
          {event.tickets.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #F1EADF' }}>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>
                {t.name}
                {!t.active && <span style={{ marginLeft: 6, fontSize: 11, color: '#A6341D' }}>désactivée</span>}
              </td>
              <td style={cell}>{fmtPrice(t.price)}</td>
              <td style={cell}>{t.sold}</td>
              <td style={cell}>{t.capacity ? `${Math.round((t.sold / t.capacity) * 100)} %` : '—'}</td>
              <td style={cell}>{formatFcfa(t.revenue)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...cell, textAlign: 'left', fontWeight: 800 }}>Total</td>
            <td style={cell} />
            <td style={{ ...cell, fontWeight: 800 }}>{totalSold(event.tickets)}</td>
            <td style={cell} />
            <td style={{ ...cell, fontWeight: 800 }}>{formatFcfa(totalRevenue(event.tickets))}</td>
          </tr>
        </tbody>
      </RTable>
      <div style={{ ...mutedText, fontSize: 12, marginTop: 10 }}>Les ventes brutes sont calculées au prix payé par chaque acheteur, même si le tarif a changé depuis.</div>
    </div>
  );
}

function ControlTab(props: Readonly<{ event: OrganizerEventItem; run: (a: () => Promise<unknown>) => Promise<void>; onOpenAssignments: () => void }>) {
  const { event, run, onOpenAssignments } = props;
  return (
    <div className="bo-card" style={{ ...cardStyle, padding: 22 }}>
      <div style={cardTitle}>Contrôle des billets</div>
      <div style={{ ...mutedText, marginBottom: 14 }}>
        Téléchargez la liste des participants (CSV) et gérez les agents de contrôle autorisés à scanner les billets de cet événement.
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" style={primaryButtonStyle} onClick={() => run(() => exportManifest(event.id))}>
          Exporter la liste des participants
        </button>
        <button type="button" style={outlineButtonStyle} onClick={onOpenAssignments}>
          Affecter des agents de contrôle
        </button>
      </div>
    </div>
  );
}

function FinancesTab({ event, onOpenFinance }: Readonly<{ event: OrganizerEventItem; onOpenFinance: () => void }>) {
  return (
    <div className="bo-card" style={{ ...cardStyle, padding: 22 }}>
      <div style={cardTitle}>Finances</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 14 }}>
        <KpiCard label="Ventes brutes" value={formatFcfa(totalRevenue(event.tickets))} sub="cet événement" color={GREEN} />
        <KpiCard label="Billets vendus" value={totalSold(event.tickets)} sub="" color={GOLD} />
      </div>
      <div style={{ ...mutedText, marginBottom: 14 }}>
        Les commissions, le solde disponible et les demandes de reversement se consultent sur la page Finances (tous événements confondus).
      </div>
      <button type="button" style={outlineButtonStyle} onClick={onOpenFinance}>
        Ouvrir les finances
      </button>
    </div>
  );
}
