import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { badge, entityActions, eventName, plain, type Column, type Row } from '../components/table/types';
import { FormPage } from '../components/FormPage';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getEvents, createEvent, updateEvent, deleteEvent, uploadEventImage, setEventImagePreset, uploadEventCover, type EventInput } from '../api/events';
import { CoverField } from '../components/CoverField';
import { LogoField } from '../components/LogoField';
import { TicketCategoriesField } from '../components/TicketCategoriesField';
import { toTicketPayloads, type TicketDraft } from '../utils/ticketDrafts';
import { Tabs } from '../components/ui';
import { applyCoverFile, applyLogo, initialLogo, type LogoChoice } from '../utils/logo';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { EventCategory, EventItem, OrganizerEventStatus } from '../types';
import { GOLD, GREEN } from '../theme';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Événement', width: 'minmax(144px,0.8fr)' },
  { label: 'Organisateur', width: 140 },
  { label: 'Catégorie', width: 130 },
  { label: 'Statut', width: 120 },
  { label: 'Ville', width: 110 },
  { label: 'Date', width: 110 },
  { label: 'Billetterie', width: 100 },
  { label: 'Actions', width: 150 },
];

const STATUS_LABEL: Record<OrganizerEventStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'En cours de validation',
  APPROVED: 'Validé, à publier',
  PUBLISHED: 'Publié',
  UNPUBLISHED: 'Dépublié',
  REJECTED: 'Rejeté',
};

const STATUS_COLOR: Record<OrganizerEventStatus, [string, string]> = {
  DRAFT: [GOLD, 'rgba(166,116,29,0.12)'],
  PENDING_APPROVAL: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: ['#1D5C8A', 'rgba(29,92,138,0.12)'],
  PUBLISHED: [GREEN, 'rgba(22,74,35,0.1)'],
  UNPUBLISHED: ['#6B6459', 'rgba(107,100,89,0.14)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

/** Un événement ADMIN classique créé directement ici a réellement `status = PUBLISHED`
 * (défaut backend, Story 2.1) — le fallback ne joue donc que pour une réponse ancienne/en
 * cache qui n'aurait pas encore ce champ, pas pour le cas normal. */
function effectiveStatus(ev: EventItem): OrganizerEventStatus {
  return ev.status ?? 'PUBLISHED';
}

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
  { key: 'desc', label: 'Description', type: 'text', fullWidth: true, optional: true },
];

function toDatetimeLocal(iso: string): string {
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

function fromDatetimeLocal(local: string): string {
  return local.length === 16 ? `${local}:00Z` : local;
}

const EMPTY = { name: '', category: 'CONCERT' as EventCategory, city: '', location: '', date: '', desc: '' };

interface EventsViewProps {
  filters: TableFilters;
  /** Statut présélectionné (ex. « à valider » depuis le tableau de bord / les notifications). */
  section?: string | null;
  onOpenDetail: (event: EventItem) => void;
}

type StatusTab = 'ALL' | OrganizerEventStatus;
const STATUS_TABS: StatusTab[] = ['ALL', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'DRAFT'];
const TAB_LABEL: Record<StatusTab, string> = {
  ALL: 'Tous',
  PENDING_APPROVAL: 'À valider',
  APPROVED: 'Validés, à publier',
  PUBLISHED: 'Publiés',
  UNPUBLISHED: 'Dépubliés',
  REJECTED: 'Rejetés',
  DRAFT: 'Brouillons',
};

export function EventsView(props: Readonly<EventsViewProps>) {
  const { filters, section = null, onOpenDetail } = props;
  const { data: events, loading, refreshing, error, reload } = useCollection(getEvents);
  const [editing, setEditing] = useState<EventItem | 'new' | null>(null);
  const [deleting, setDeleting] = useState<EventItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>(
    STATUS_TABS.includes(section as StatusTab) ? (section as StatusTab) : 'ALL',
  );
  const [cover, setCover] = useState<LogoChoice | null>(() => initialLogo(EMPTY.category));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // Aucune catégorie au départ : elles sont créées par la fenêtre rapide (au moins une exigée à l'envoi).
  const [ticketDrafts, setTicketDrafts] = useState<TicketDraft[]>([]);

  if (loading) return <LoadingState label="Chargement des événements…" />;
  if (error) return <ErrorState message={error} />;

  const scoped = statusTab === 'ALL' ? events : events.filter((ev) => effectiveStatus(ev) === statusTab);
  const tabs = STATUS_TABS.map((id) => ({
    id,
    label: TAB_LABEL[id],
    count: id === 'ALL' ? events.length : events.filter((ev) => effectiveStatus(ev) === id).length,
  }));
  const filtered = filterRows(scoped, ['name', 'city', 'location'], filters.search, '', '');
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((ev) => {
    const status = effectiveStatus(ev);
    const [statusColor, statusBg] = STATUS_COLOR[status];
    return {
      key: ev.id,
      cells: [
        eventName(ev.category, ev.name),
        plain(ev.organizerName ?? 'Plateforme'),
        badge(CATEGORY_LABELS[ev.category], GREEN, 'rgba(22,74,35,0.1)'),
        badge(STATUS_LABEL[status], statusColor, statusBg),
        plain(ev.city),
        plain(new Date(ev.date).toLocaleDateString('fr-FR')),
        ev.tickets.length > 0 && ev.tickets.every((t) => t.price === 0)
          ? badge('Gratuit', '#FFFFFF', '#14B53A')
          : badge(`${ev.tickets.length} type(s)`, GOLD, 'rgba(166,116,29,0.12)'),
        // Événement d'organisateur : l'admin le modère (valider, rejeter, supprimer) sans en modifier le contenu.
        entityActions(ev.organizerName ? undefined : () => setEditing(ev), () => onOpenDetail(ev), () => setDeleting(ev)),
      ],
    };
  });

  const submit = async (values: FormValues) => {
    const payload = { ...values, date: fromDatetimeLocal(String(values.date)) } as unknown as EventInput;
    if (editing && editing !== 'new') {
      await updateEvent(editing.id, payload);
      setSuccessMsg(`Événement ${payload.name} mis à jour avec succès`);
    } else {
      const tickets = toTicketPayloads(ticketDrafts);
      // Un événement de la plateforme est publié immédiatement : sa couverture est donc exigée dès la création.
      if (!coverFile) throw new Error("Ajoutez une image de couverture : un événement de la plateforme est publié dès sa création.");
      const created = await createEvent({ ...payload, tickets });
      const logoWarning = await applyLogo(created.id, payload.category, cover ?? initialLogo(payload.category), { upload: uploadEventImage, preset: setEventImagePreset });
      const coverWarning = await applyCoverFile(created.id, coverFile, uploadEventCover);
      const warning = [logoWarning, coverWarning].filter(Boolean).join(' ') || null;
      // Événement de la plateforme : en ligne immédiatement, sans validation.
      setSuccessMsg(
        warning ? `Événement ${payload.name} créé et publié. ${warning}` : `Événement ${payload.name} créé et publié avec succès`,
      );
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
      {editing !== 'new' && (
        <Tabs
          tabs={tabs}
          active={statusTab}
          onChange={(id) => {
            setStatusTab(id);
            filters.setPage(1);
          }}
        />
      )}
      {editing !== 'new' && (
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
          setCover(initialLogo(EMPTY.category));
          setCoverFile(null);
          setTicketDrafts([]);
          setEditing('new');
        }}
      />
      )}

      {editing === 'new' && (
        <FormPage title="Nouvel événement" backLabel="Retour aux événements" onBack={closeModal} intro="Événement de la plateforme : il est publié dès sa création, sans validation. Renseignez ses catégories de billets et son identité visuelle.">
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
                        <TicketCategoriesField value={ticketDrafts} onChange={setTicketDrafts} />
                        <LogoField category={String(values.category)} value={cover} onChange={setCover} />
                        <CoverField file={coverFile} onChange={setCoverFile} logoFile={cover?.kind === 'file' ? cover.file : null} />
                      </div>
                    )
                  : undefined
              }
            />
          )}
        </FormPage>
      )}

      {editing && editing !== 'new' && (
        <Modal title={modalTitle} onClose={closeModal} size="md">
          {successMsg ? (
            <SuccessPanel message={successMsg} onClose={closeModal} />
          ) : (
            <EntityForm
              fields={FIELDS}
              initialValues={initialValues}
              submitLabel="Enregistrer"
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
