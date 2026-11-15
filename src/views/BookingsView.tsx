import { TableView } from '../components/table/TableView';
import { plain, badge, detailOnlyActions, type Column, type Row } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { searchBookings } from '../api/bookings';
import { usePagedList } from '../hooks/usePagedList';
import type { TableFilters } from '../hooks/useTableFilters';
import type { AdminBooking, BookingStatus } from '../types';

const STATUS_COLORS: Record<BookingStatus, [string, string]> = {
  CONFIRMED: ['#0F9430', 'rgba(20,181,58,0.12)'],
  PENDING: ['#9A7800', 'rgba(252,209,22,0.2)'],
  CANCELLED: ['#CE1126', 'rgba(206,17,38,0.12)'],
};

const PAGE_SIZE = 20;

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

/** Libellé affiché dans le filtre -> statut envoyé au serveur. */
const STATUS_BY_LABEL = Object.fromEntries(
  (Object.entries(STATUS_LABEL) as [BookingStatus, string][]).map(([status, label]) => [label, status]),
) as Record<string, BookingStatus>;

export function BookingsView({ filters, onOpenDetail }: BookingsViewProps) {
  // Page, filtre et recherche sont traités par le serveur : seule la page affichée est téléchargée.
  const status = STATUS_BY_LABEL[filters.statusFilter];
  const { items, hasNext, loading, refreshing, error } = usePagedList(
    ({ page, size, q, filters: f }) => searchBookings({ page, size, q, status: f.status }),
    { page: filters.page, size: PAGE_SIZE, search: filters.search, filters: { status } },
  );

  if (loading) return <LoadingState label="Chargement des réservations…" />;
  if (error) return <ErrorState message={error} />;

  const page = filters.page;

  const rows: Row[] = items.map((b) => {
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
        totalRows={rows.length}
        totalLabel={`${rows.length} réservation${rows.length > 1 ? 's' : ''} sur cette page`}
        page={page}
        totalPages={page}
        hasNext={hasNext}
        onPrevPage={() => filters.setPage(Math.max(1, page - 1))}
        onNextPage={() => filters.setPage(page + 1)}
        statusOptions={Object.values(STATUS_LABEL)}
        statusFilter={filters.statusFilter}
        onStatusFilter={filters.onStatusFilter}
      />
    </>
  );
}
