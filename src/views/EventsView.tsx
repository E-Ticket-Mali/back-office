import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { plain, badge, entityActions, type Column, type Row } from '../components/table/types';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getEvents, createEvent, updateEvent, deleteEvent, type EventInput } from '../api/events';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { EventCategory, EventItem } from '../types';
import { GOLD, GREEN } from '../theme';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Événement', width: 'minmax(144px,0.8fr)' },
  { label: 'Catégorie', width: 130 },
  { label: 'Ville', width: 110 },
  { label: 'Date', width: 110 },
  { label: 'Billetterie', width: 100 },
  { label: 'Actions', width: 150 },
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

const FIELDS: FieldDef[] = [
  { key: 'name', label: "Nom de l'événement", type: 'text' },
  { key: 'category', label: 'Catégorie', type: 'select', options: CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })) },
  { key: 'city', label: 'Ville', type: 'text' },
  { key: 'location', label: 'Lieu', type: 'text' },
  { key: 'date', label: 'Date et heure', type: 'datetime-local' },
  { key: 'icon', label: 'Icône (emoji)', type: 'text' },
  { key: 'desc', label: 'Description', type: 'text', fullWidth: true },
];

function toDatetimeLocal(iso: string): string {
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

function fromDatetimeLocal(local: string): string {
  return local.length === 16 ? `${local}:00Z` : local;
}

const EMPTY = { name: '', category: 'CONCERT' as EventCategory, city: '', location: '', date: '', icon: '🎫', desc: '' };

interface EventsViewProps {
  filters: TableFilters;
  onOpenDetail: (event: EventItem) => void;
}

export function EventsView(props: Readonly<EventsViewProps>) {
  const { filters, onOpenDetail } = props;
  const { data: events, loading, refreshing, error, reload } = useCollection(getEvents);
  const [editing, setEditing] = useState<EventItem | 'new' | null>(null);
  const [deleting, setDeleting] = useState<EventItem | null>(null);
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
      plain(`${ev.icon ?? ''} ${ev.name}`),
      badge(CATEGORY_LABELS[ev.category], GREEN, 'rgba(22,74,35,0.1)'),
      plain(ev.city),
      plain(new Date(ev.date).toLocaleDateString('fr-FR')),
      badge(`${ev.tickets.length} type(s)`, GOLD, 'rgba(166,116,29,0.12)'),
      entityActions(() => setEditing(ev), () => onOpenDetail(ev), () => setDeleting(ev)),
    ],
  }));

  const submit = async (values: FormValues) => {
    const payload = { ...values, date: fromDatetimeLocal(String(values.date)) } as unknown as EventInput;
    if (editing && editing !== 'new') {
      await updateEvent(editing.id, payload);
      setSuccessMsg(`Événement ${payload.name} mis à jour avec succès`);
    } else {
      await createEvent(payload);
      setSuccessMsg(`Événement ${payload.name} créé avec succès`);
    }
    reload();
  };

  const closeModal = () => {
    setEditing(null);
    setSuccessMsg(null);
  };

  const confirmDelete = async (reason: string) => {
    if (deleting) {
      console.info(`Événement ${deleting.name} supprimé — motif : ${reason}`);
      await deleteEvent(deleting.id);
      setDeleting(null);
      reload();
    }
  };

  let initialValues = EMPTY;
  if (editing && editing !== 'new') {
    initialValues = {
      name: editing.name,
      category: editing.category,
      city: editing.city,
      location: editing.location,
      date: toDatetimeLocal(editing.date),
      icon: editing.icon ?? '',
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

      {deleting && (
        <ConfirmDialog
          title="Supprimer l'événement"
          message={`Supprimer ${deleting.name} et tous ses billets ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
