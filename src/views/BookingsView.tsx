import { TableView } from '../components/table/TableView';
import { plain, badge, detailOnlyActions, type Column, type Row } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getBookings } from '../api/bookings';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminBooking, BookingStatus } from '../types';

const STATUS_COLORS: Record<BookingStatus, [string, string]> = {
  CONFIRMED: ['#0F9430', 'rgba(20,181,58,0.12)'],
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  CANCELLED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Client', width: 'minmax(140px,1fr)' },
  { label: 'Objet', width: 'minmax(160px,1fr)' },
  { label: 'Type', width: 90 },
  { label: 'Montant', width: 110 },
  { label: 'Statut', width: 110 },
  { label: 'Créée le', width: 130 },
  { label: 'Actions', width: 110 },
];

const STATUS_LABEL: Record<BookingStatus, string> = { CONFIRMED: 'Confirmée', PENDING: 'En attente', CANCELLED: 'Annulée' };

interface BookingsViewProps {
  filters: TableFilters;
  onOpenDetail: (booking: AdminBooking) => void;
}

export function BookingsView({ filters, onOpenDetail }: BookingsViewProps) {
  const { data: bookings, loading, refreshing, error } = useCollection(getBookings);

  if (loading) return <LoadingState label="Chargement des réservations…" />;
  if (error) return <ErrorState message={error} />;

  const withStatut = bookings.map((b) => ({ ...b, statut: STATUS_LABEL[b.status] }));
  const filtered = filterRows(withStatut, ['clientName', 'clientPhone', 'hotelName', 'itemLabel'], filters.search, '', filters.statusFilter);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((b) => {
    const [color, bg] = STATUS_COLORS[b.status];
    return {
      key: b.id,
      cells: [
        plain(b.clientName),
        plain(`${b.hotelName} · ${b.itemLabel}`),
        badge(b.kind === 'HOTEL' ? 'Hôtel' : 'Événement', '#1F2E35', '#E4E9EB'),
        plain(`${b.total.toLocaleString('fr-FR')} FCFA`),
        badge(STATUS_LABEL[b.status], color, bg),
        plain(b.createdAt),
        detailOnlyActions(() => onOpenDetail(b)),
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
