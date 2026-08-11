import { TableView } from '../components/table/TableView';
import { plain, detailOnlyActions, type Column, type Row } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getClients } from '../api/clients';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminClient } from '../types';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Nom', width: 'minmax(160px,1fr)' },
  { label: 'Téléphone', width: 140 },
  { label: 'E-mail', width: 'minmax(140px,1fr)' },
  { label: 'Réservations', width: 110 },
  { label: 'Inscrit le', width: 110 },
  { label: 'Actions', width: 90 },
];

interface ClientsViewProps {
  filters: TableFilters;
  onOpenDetail: (client: AdminClient) => void;
}

export function ClientsView({ filters, onOpenDetail }: ClientsViewProps) {
  const { data: clients, loading, refreshing, error } = useCollection(getClients);

  if (loading) return <LoadingState label="Chargement des clients…" />;
  if (error) return <ErrorState message={error} />;

  const filtered = filterRows(clients, ['name', 'phone', 'email'], filters.search, '', '');
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((c) => ({
    key: c.id,
    cells: [
      plain(c.name || '—'),
      plain(c.phone),
      plain(c.email || '—'),
      plain(c.bookingCount),
      plain(c.createdAt),
      detailOnlyActions(() => onOpenDetail(c)),
    ],
  }));

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
      />
    </>
  );
}
