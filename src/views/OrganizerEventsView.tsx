import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableView } from '../components/table/TableView';
import { badge, detailOnlyActions, eventName, plain, type Column, type Row, type RowExtraAction } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getOrganizerEvents, publishOrganizerEvent, unpublishOrganizerEvent } from '../api/organizerEvents';
import { Tabs } from '../components/ui';
import { PublishDialog } from '../components/PublishDialog';
import { filterRows } from '../utils/filterRows';
import { isOrganizerEventEditable, ORGANIZER_STATUS_LABEL } from '../utils/eventLabels';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { OrganizerEventItem, OrganizerEventStatus } from '../types';
import { GOLD, GREEN } from '../theme';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Événement', width: 'minmax(144px,0.8fr)' },
  { label: 'Statut', width: 170 },
  { label: 'Ville', width: 110 },
  { label: 'Date', width: 110 },
  { label: 'Actions', width: 200 },
];

const STATUS_COLOR: Record<OrganizerEventStatus, [string, string]> = {
  DRAFT: [GOLD, 'rgba(166,116,29,0.12)'],
  PENDING_APPROVAL: ['#9A7800', 'rgba(252,209,22,0.2)'],
  APPROVED: ['#1D5C8A', 'rgba(29,92,138,0.12)'],
  PUBLISHED: [GREEN, 'rgba(22,74,35,0.1)'],
  UNPUBLISHED: ['#6B6459', 'rgba(107,100,89,0.14)'],
  REJECTED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

interface OrganizerEventsViewProps {
  filters: TableFilters;
  /** Statut présélectionné (lien depuis le tableau de bord) ; null = tous. */
  section?: string | null;
}

type StatusTab = 'ALL' | OrganizerEventStatus;
const STATUS_TABS: StatusTab[] = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'REJECTED'];
const TAB_LABEL: Record<StatusTab, string> = {
  ALL: 'Tous',
  DRAFT: 'Brouillons',
  PENDING_APPROVAL: 'En cours de validation',
  APPROVED: 'Validés, à publier',
  PUBLISHED: 'Publiés',
  UNPUBLISHED: 'Dépubliés',
  REJECTED: 'Rejetés',
};

/** Liste des événements : la création, la modification et la consultation sont des pages ; seules
 * la publication et la dépublication (décisions courtes) passent par une fenêtre de confirmation. */
export function OrganizerEventsView(props: Readonly<OrganizerEventsViewProps>) {
  const { filters, section = null } = props;
  const navigate = useNavigate();
  const { data: events, loading, refreshing, error, reload } = useCollection(getOrganizerEvents);
  const [publishing, setPublishing] = useState<{ event: OrganizerEventItem; mode: 'publish' | 'unpublish' } | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>(
    STATUS_TABS.includes(section as StatusTab) ? (section as StatusTab) : 'ALL',
  );

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
    if (ev.status === 'APPROVED' || ev.status === 'UNPUBLISHED') {
      const label = ev.status === 'UNPUBLISHED' ? 'Republier' : 'Publier';
      // La couverture est requise pour publier : sans elle, on renvoie vers la page de l'événement.
      if (ev.coverUrl == null) return { label, primary: true, onClick: () => navigate(`/organizer/events/${ev.id}`) };
      return { label, primary: true, onClick: () => setPublishing({ event: ev, mode: 'publish' }) };
    }
    if (ev.status === 'PUBLISHED') return { label: 'Dépublier', onClick: () => setPublishing({ event: ev, mode: 'unpublish' }) };
    return undefined;
  };

  const rows: Row[] = pageSlice.map((ev) => ({
    key: ev.id,
    cells: [
      eventName(ev.category, ev.name),
      badge(ORGANIZER_STATUS_LABEL[ev.status], STATUS_COLOR[ev.status][0], STATUS_COLOR[ev.status][1]),
      plain(ev.city),
      plain(new Date(ev.date).toLocaleDateString('fr-FR')),
      detailOnlyActions(
        () => navigate(`/organizer/events/${ev.id}`),
        publicationAction(ev),
        isOrganizerEventEditable(ev.status) ? 'Gérer' : 'Consulter',
      ),
    ],
  }));

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
        createLabel="+ Créer un événement"
        columns={COLUMNS}
        rows={rows}
        totalRows={totalRows}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => filters.setPage(Math.max(1, page - 1))}
        onNextPage={() => filters.setPage(Math.min(totalPages, page + 1))}
        onCreate={() => navigate('/organizer/events/new')}
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
    </>
  );
}
