import { TableView } from '../components/table/TableView';
import { plain, detailOnlyActions, type Column, type Row } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { searchClients } from '../api/clients';
import { usePagedList } from '../hooks/usePagedList';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminClient } from '../types';

const PAGE_SIZE = 20;

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
  const { items, hasNext, loading, refreshing, error } = usePagedList(
    ({ page, size, q }) => searchClients({ page, size, q }),
    { page: filters.page, size: PAGE_SIZE, search: filters.search, filters: {} },
  );

  if (loading) return <LoadingState label="Chargement des clients…" />;
  if (error) return <ErrorState message={error} />;

  const page = filters.page;

  const rows: Row[] = items.map((c) => ({
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
        totalRows={rows.length}
        totalLabel={`${rows.length} client${rows.length > 1 ? 's' : ''} sur cette page`}
        page={page}
        totalPages={page}
        hasNext={hasNext}
        onPrevPage={() => filters.setPage(Math.max(1, page - 1))}
        onNextPage={() => filters.setPage(page + 1)}
      />
    </>
  );
}
