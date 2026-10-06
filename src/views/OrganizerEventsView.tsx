import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { badge, detailOnlyActions, editDetailActions, eventName, plain, type Column, type Row } from '../components/table/types';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getOrganizerEvents, createOrganizerEvent, updateOrganizerEvent, type OrganizerEventInput } from '../api/organizerEvents';
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
  { label: 'Actions', width: 120 },
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
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
};

const STATUS_COLOR: Record<OrganizerEventStatus, [string, string]> = {
  DRAFT: [GOLD, 'rgba(166,116,29,0.12)'],
  PENDING_APPROVAL: ['#9A7800', 'rgba(252,209,22,0.2)'],
  PUBLISHED: [GREEN, 'rgba(22,74,35,0.1)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

/** Édition impossible une fois soumis — cohérent avec le backend qui rejette PENDING_APPROVAL/PUBLISHED (Story 2.2/2.5). */
function isOrganizerEventEditable(status: OrganizerEventStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
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
  onOpenDetail: (event: OrganizerEventItem) => void;
}

export function OrganizerEventsView(props: Readonly<OrganizerEventsViewProps>) {
  const { filters, onOpenDetail } = props;
  const { data: events, loading, refreshing, error, reload } = useCollection(getOrganizerEvents);
  const [editing, setEditing] = useState<OrganizerEventItem | 'new' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (loading) return <LoadingState label="Chargement des événements…" />;
  if (error) return <ErrorState message={error} />;

  const filtered = filterRows(events, ['name', 'city', 'location'], filters.search, '', '');
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((ev) => ({
    key: ev.id,
    cells: [
      eventName(ev.category, ev.name),
      badge(STATUS_LABEL[ev.status], STATUS_COLOR[ev.status][0], STATUS_COLOR[ev.status][1]),
      plain(ev.city),
      plain(new Date(ev.date).toLocaleDateString('fr-FR')),
      isOrganizerEventEditable(ev.status)
        ? editDetailActions(() => setEditing(ev), () => onOpenDetail(ev))
        : detailOnlyActions(() => onOpenDetail(ev)),
    ],
  }));

  const submit = async (values: FormValues) => {
    const payload = { ...values, date: fromDatetimeLocal(String(values.date)) } as unknown as OrganizerEventInput;
    if (editing && editing !== 'new') {
      await updateOrganizerEvent(editing.id, payload);
      setSuccessMsg(`Événement ${payload.name} mis à jour avec succès`);
    } else {
      await createOrganizerEvent(payload);
      setSuccessMsg(`Événement ${payload.name} créé avec succès (brouillon)`);
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
      <TableView
        columns={COLUMNS}
        rows={rows}
        totalRows={totalRows}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => filters.setPage(Math.max(1, page - 1))}
        onNextPage={() => filters.setPage(Math.min(totalPages, page + 1))}
        onCreate={() => setEditing('new')}
      />

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
            />
          )}
        </Modal>
      )}
    </>
  );
}
