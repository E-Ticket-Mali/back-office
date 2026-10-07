import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { badge, detailOnlyActions, editDetailActions, eventName, plain, type Column, type Row } from '../components/table/types';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import {
  getOrganizerEvents,
  createOrganizerEvent,
  updateOrganizerEvent,
  uploadOrganizerEventImage,
  publishOrganizerEvent,
  unpublishOrganizerEvent,
  setOrganizerEventImagePreset,
  type OrganizerEventInput,
} from '../api/organizerEvents';
import { CoverField } from '../components/CoverField';
import { TicketTypesField } from '../components/TicketTypesField';
import { newTicketDraft, toTicketPayloads, type TicketDraft } from '../utils/ticketDrafts';
import { Tabs } from '../components/ui';
import { PublishDialog } from '../components/PublishDialog';
import type { RowExtraAction } from '../components/table/types';
import { applyCover, initialCover, type CoverChoice } from '../utils/cover';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { EventCategory, OrganizerEventItem, OrganizerEventStatus } from '../types';
import { GOLD, GREEN } from '../theme';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Événement', width: 'minmax(144px,0.8fr)' },
  { label: 'Statut', width: 150 },
  { label: 'Ville', width: 110 },
  { label: 'Date', width: 110 },
  { label: 'Actions', width: 230 },
];

const CATEGORIES: EventCategory[] = ['HIPPIQUE', 'CONCERT', 'SPORT', 'CONFERENCE', 'CINEMA', 'THEATRE'];
const CATEGORY_LABELS: Record<EventCategory, string> = {
  HIPPIQUE: 'Courses hippiques',
  CONCERT: 'Concert',
  SPORT: 'Sport',
  CONFERENCE: 'Conférence',
  CINEMA: 'Cinéma',
  THEATRE: 'Théâtre',
};

const STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'En attente',
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

/** Seule une validation en cours verrouille l'événement ; une modification publiée déclenche une nouvelle revue. */
function isOrganizerEventEditable(status: OrganizerEventStatus): boolean {
  return status !== 'PENDING_APPROVAL';
}

const FIELDS: FieldDef[] = [
  { key: 'name', label: "Nom de l'événement", type: 'text' },
  { key: 'category', label: 'Catégorie', type: 'select', options: CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })) },
  { key: 'city', label: 'Ville', type: 'text' },
  { key: 'location', label: 'Lieu', type: 'text' },
  { key: 'date', label: 'Date et heure', type: 'datetime-local' },
  { key: 'desc', label: 'Description', type: 'text', fullWidth: true, optional: true },
];

function toDatetimeLocal(iso: string): string {
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

function fromDatetimeLocal(local: string): string {
  return local.length === 16 ? `${local}:00Z` : local;
}

const EMPTY = { name: '', category: 'CONCERT' as EventCategory, city: '', location: '', date: '', desc: '' };

interface OrganizerEventsViewProps {
  filters: TableFilters;
  /** Statut présélectionné (lien depuis le tableau de bord) ; null = tous. */
  section?: string | null;
  onOpenDetail: (event: OrganizerEventItem) => void;
}

type StatusTab = 'ALL' | OrganizerEventStatus;
const STATUS_TABS: StatusTab[] = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED'];
const TAB_LABEL: Record<StatusTab, string> = {
  ALL: 'Tous',
  DRAFT: 'Brouillons',
  PENDING_APPROVAL: 'En attente de validation',
  APPROVED: 'Validés, à publier',
  PUBLISHED: 'Publiés',
  REJECTED: 'Rejetés',
};

export function OrganizerEventsView(props: Readonly<OrganizerEventsViewProps>) {
  const { filters, section = null, onOpenDetail } = props;
  const { data: events, loading, refreshing, error, reload } = useCollection(getOrganizerEvents);
  const [editing, setEditing] = useState<OrganizerEventItem | 'new' | null>(null);
  const [publishing, setPublishing] = useState<{ event: OrganizerEventItem; mode: 'publish' | 'unpublish' } | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>(
    STATUS_TABS.includes(section as StatusTab) ? (section as StatusTab) : 'ALL',
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cover, setCover] = useState<CoverChoice>(() => initialCover(EMPTY.category));
  const [ticketDrafts, setTicketDrafts] = useState<TicketDraft[]>(() => [newTicketDraft()]);

  if (loading) return <LoadingState label="Chargement des événements…" />;
  if (error) return <ErrorState message={error} />;

  const scoped = statusTab === 'ALL' ? events : events.filter((ev) => ev.status === statusTab);
  const tabs = STATUS_TABS.map((id) => ({
    id,
    label: TAB_LABEL[id],
    count: id === 'ALL' ? events.length : events.filter((ev) => ev.status === id).length,
  }));
  const filtered = filterRows(scoped, ['name', 'city', 'location'], filters.search, '', '');
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** Publier / Dépublier : l'action principale d'un événement validé, directement depuis la liste. */
  const publicationAction = (ev: OrganizerEventItem): RowExtraAction | undefined => {
    if (ev.status === 'APPROVED') return { label: 'Publier', primary: true, onClick: () => setPublishing({ event: ev, mode: 'publish' }) };
    if (ev.status === 'PUBLISHED') return { label: 'Dépublier', onClick: () => setPublishing({ event: ev, mode: 'unpublish' }) };
    return undefined;
  };

  const rows: Row[] = pageSlice.map((ev) => ({
    key: ev.id,
    cells: [
      eventName(ev.category, ev.name),
      badge(STATUS_LABEL[ev.status], STATUS_COLOR[ev.status][0], STATUS_COLOR[ev.status][1]),
      plain(ev.city),
      plain(new Date(ev.date).toLocaleDateString('fr-FR')),
      isOrganizerEventEditable(ev.status)
        ? editDetailActions(() => setEditing(ev), () => onOpenDetail(ev), publicationAction(ev))
        : detailOnlyActions(() => onOpenDetail(ev), publicationAction(ev)),
    ],
  }));

  const submit = async (values: FormValues) => {
    const payload = { ...values, date: fromDatetimeLocal(String(values.date)) } as unknown as OrganizerEventInput;
    if (editing && editing !== 'new') {
      await updateOrganizerEvent(editing.id, payload);
      setSuccessMsg(`Événement ${payload.name} mis à jour avec succès`);
    } else {
      const created = await createOrganizerEvent({ ...payload, tickets: toTicketPayloads(ticketDrafts) });
      const warning = await applyCover(created.id, payload.category, cover, {
        upload: uploadOrganizerEventImage,
        preset: setOrganizerEventImagePreset,
      });
      setSuccessMsg(warning ? `Événement ${payload.name} créé (brouillon). ${warning}` : `Événement ${payload.name} créé avec succès (brouillon)`);
    }
    reload();
  };

  const closeModal = () => {
    setEditing(null);
    setSuccessMsg(null);
  };

  let initialValues = EMPTY;
  if (editing && editing !== 'new') {
    initialValues = {
      name: editing.name,
      category: editing.category,
      city: editing.city,
      location: editing.location,
      date: toDatetimeLocal(editing.date),
      desc: editing.desc ?? '',
    };
  }

  let modalTitle = 'Nouvel événement';
  if (editing && editing !== 'new') {
    modalTitle = "Modifier l'événement";
  }
  if (successMsg) {
    modalTitle = 'Confirmation';
  }

  return (
    <>
      {refreshing && <InlineRefreshHint />}
      <Tabs
        tabs={tabs}
        active={statusTab}
        onChange={(id) => {
          setStatusTab(id);
          filters.setPage(1);
        }}
      />
      <TableView
        createLabel="+ Nouvel événement"
        columns={COLUMNS}
        rows={rows}
        totalRows={totalRows}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => filters.setPage(Math.max(1, page - 1))}
        onNextPage={() => filters.setPage(Math.min(totalPages, page + 1))}
        onCreate={() => {
          setCover(initialCover(EMPTY.category));
          setTicketDrafts([newTicketDraft()]);
          setEditing('new');
        }}
      />

      {publishing && (
        <PublishDialog
          mode={publishing.mode}
          eventName={publishing.event.name}
          onCancel={() => setPublishing(null)}
          onConfirm={async () => {
            if (publishing.mode === 'publish') await publishOrganizerEvent(publishing.event.id);
            else await unpublishOrganizerEvent(publishing.event.id);
            setPublishing(null);
            reload();
          }}
        />
      )}

      {editing && (
        <Modal title={modalTitle} onClose={closeModal} size="md">
          {successMsg ? (
            <SuccessPanel message={successMsg} onClose={closeModal} />
          ) : (
            <EntityForm
              fields={FIELDS}
              initialValues={initialValues}
              submitLabel={editing === 'new' ? 'Créer' : 'Enregistrer'}
              onSubmit={submit}
              onCancel={closeModal}
              renderExtra={
                editing === 'new'
                  ? (values) => (
                      <div style={{ display: 'grid', gap: 18 }}>
                        <TicketTypesField value={ticketDrafts} onChange={setTicketDrafts} />
                        <CoverField category={String(values.category)} value={cover} onChange={setCover} />
                      </div>
                    )
                  : undefined
              }
            />
          )}
        </Modal>
      )}
    </>
  );
}
