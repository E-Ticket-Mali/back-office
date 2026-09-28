import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { plain, entityActions, rating, type Column, type Row } from '../components/table/types';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getHotels, createHotel, updateHotel, deleteHotel, type HotelInput } from '../api/hotels';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { Hotel } from '../types';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Nom', width: 'minmax(128px,0.75fr)' },
  { label: 'Ville', width: 120 },
  { label: 'Emplacement', width: 180 },
  { label: 'Note', width: 80 },
  { label: 'Chambres', width: 90 },
  { label: 'Actions', width: 150 },
];

const FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nom de l’hôtel', type: 'text' },
  { key: 'city', label: 'Ville', type: 'text' },
  { key: 'location', label: 'Emplacement', type: 'text' },
  { key: 'rating', label: 'Note (sur 5)', type: 'number', min: 0, max: 5 },
  { key: 'desc', label: 'Description', type: 'text', fullWidth: true, optional: true },
];

const EMPTY: HotelInput = { name: '', city: '', location: '', rating: 4, desc: '' };

interface HotelsViewProps {
  filters: TableFilters;
  onOpenDetail: (hotel: Hotel) => void;
}

export function HotelsView({ filters, onOpenDetail }: HotelsViewProps) {
  const { data: hotels, loading, refreshing, error, reload } = useCollection(getHotels);
  const [editing, setEditing] = useState<Hotel | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Hotel | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (loading) return <LoadingState label="Chargement des hôtels…" />;
  if (error) return <ErrorState message={error} />;

  const filtered = filterRows(hotels, ['name', 'city', 'location'], filters.search, '', '');
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((h) => ({
    key: h.id,
    cells: [
      plain(h.name),
      plain(h.city),
      plain(h.location),
      rating(h.rating),
      plain(h.rooms.length),
      entityActions(() => setEditing(h), () => onOpenDetail(h), () => setDeleting(h)),
    ],
  }));

  const submit = async (values: FormValues) => {
    const payload = values as unknown as HotelInput;
    if (editing && editing !== 'new') {
      await updateHotel(editing.id, payload);
      setSuccessMsg(`Hôtel ${payload.name} mis à jour avec succès`);
    } else {
      await createHotel(payload);
      setSuccessMsg(`Hôtel ${payload.name} créé avec succès`);
    }
    reload();
  };

  const closeModal = () => {
    setEditing(null);
    setSuccessMsg(null);
  };

  const confirmDelete = async (reason: string) => {
    if (deleting) {
      console.info(`Hôtel ${deleting.name} supprimé — motif : ${reason}`);
      await deleteHotel(deleting.id);
      setDeleting(null);
      reload();
    }
  };

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
        <Modal title={successMsg ? 'Confirmation' : editing === 'new' ? 'Nouvel hôtel' : "Modifier l'hôtel"} onClose={closeModal} size="md">
          {successMsg ? (
            <SuccessPanel message={successMsg} onClose={closeModal} />
          ) : (
            <EntityForm
              fields={FIELDS}
              initialValues={editing === 'new' ? EMPTY : editing}
              submitLabel={editing === 'new' ? 'Créer' : 'Enregistrer'}
              onSubmit={submit}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer l'hôtel"
          message={`Supprimer ${deleting.name} et toutes ses chambres ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
