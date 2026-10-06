import { TableView } from '../components/table/TableView';
import { badge, detailOnlyActions, plain, type Column, type Row } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getOrganizers } from '../api/organizers';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminOrganizer, OrganizerStatus } from '../types';
import { GOLD, GREEN } from '../theme';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Organisateur', width: 'minmax(160px,1fr)' },
  { label: 'Contact', width: 'minmax(160px,1fr)' },
  { label: 'Statut', width: 130 },
  { label: 'Inscrit le', width: 120 },
  { label: 'Actions', width: 100 },
];

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

interface OrganizersViewProps {
  filters: TableFilters;
  onOpenDetail: (organizer: AdminOrganizer) => void;
}

export function OrganizersView(props: Readonly<OrganizersViewProps>) {
  const { filters, onOpenDetail } = props;
  const { data: organizers, loading, refreshing, error } = useCollection(getOrganizers);

  if (loading) return <LoadingState label="Chargement des organisateurs…" />;
  if (error) return <ErrorState message={error} />;

  const withStatut = organizers.map((o) => ({ ...o, statut: STATUS_LABEL[o.status] }));
  const filtered = filterRows(withStatut, ['name', 'email', 'phone'], filters.search, '', filters.statusFilter);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((o) => {
    const [color, bg] = STATUS_COLOR[o.status];
    return {
      key: o.id,
      cells: [
        plain(o.name),
        plain(`${o.email} · ${o.phone}`),
        badge(STATUS_LABEL[o.status], color, bg),
        plain(o.createdAt),
        detailOnlyActions(() => onOpenDetail(o)),
      ],
    };
  });

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
        statusOptions={Object.values(STATUS_LABEL)}
        statusFilter={filters.statusFilter}
        onStatusFilter={filters.onStatusFilter}
      />
    </>
  );
}
