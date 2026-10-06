import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { plain, entityActions, type Column, type Row } from '../components/table/types';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getOrganizerStaff, createOrganizerStaff, updateOrganizerStaff, deleteOrganizerStaff } from '../api/organizerStaff';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { OrganizerStaffAgent } from '../types';

const PAGE_SIZE = 8;

const COLUMNS: Column[] = [
  { label: 'Agent', width: 'minmax(160px,1fr)' },
  { label: 'Code contrôleur', width: 160 },
  { label: 'Créé le', width: 120 },
  { label: 'Actions', width: 150 },
];

const CREATE_FIELDS: FieldDef[] = [
  { key: 'staffCode', label: 'Code contrôleur', type: 'text' },
  { key: 'agentName', label: "Nom de l'agent", type: 'text' },
];

const EDIT_FIELDS: FieldDef[] = [{ key: 'agentName', label: "Nom de l'agent", type: 'text' }];

const EMPTY = { staffCode: '', agentName: '' };

interface OrganizerAgentsViewProps {
  filters: TableFilters;
  onOpenDetail: (agent: OrganizerStaffAgent) => void;
}

export function OrganizerAgentsView({ filters, onOpenDetail }: OrganizerAgentsViewProps) {
  const { data: agents, loading, refreshing, error, reload } = useCollection(getOrganizerStaff);
  const [editing, setEditing] = useState<OrganizerStaffAgent | 'new' | null>(null);
  const [deleting, setDeleting] = useState<OrganizerStaffAgent | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (loading) return <LoadingState label="Chargement des agents…" />;
  if (error) return <ErrorState message={error} />;

  const filtered = filterRows(agents, ['agentName', 'staffCode'], filters.search, '', '');
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows: Row[] = pageSlice.map((a) => ({
    key: a.id,
    cells: [
      plain(a.agentName),
      plain(a.staffCode),
      plain(a.createdAt),
      entityActions(() => setEditing(a), () => onOpenDetail(a), () => setDeleting(a)),
    ],
  }));

  const submit = async (values: FormValues) => {
    if (editing && editing !== 'new') {
      await updateOrganizerStaff(editing.id, { agentName: String(values.agentName) });
      setSuccessMsg(`Agent ${values.agentName} mis à jour avec succès`);
    } else {
      await createOrganizerStaff({ staffCode: String(values.staffCode), agentName: String(values.agentName) });
      setSuccessMsg(`Agent ${values.agentName} créé avec succès`);
    }
    reload();
  };

  const closeModal = () => {
    setEditing(null);
    setSuccessMsg(null);
  };

  const confirmDelete = async (reason: string) => {
    if (deleting) {
      console.info(`Agent ${deleting.agentName} supprimé — motif : ${reason}`);
      await deleteOrganizerStaff(deleting.id);
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
        <Modal title={successMsg ? 'Confirmation' : editing === 'new' ? 'Nouvel agent' : "Modifier l'agent"} onClose={closeModal} size="sm">
          {successMsg ? (
            <SuccessPanel message={successMsg} onClose={closeModal} />
          ) : (
            <EntityForm
              fields={editing === 'new' ? CREATE_FIELDS : EDIT_FIELDS}
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
          title="Supprimer l'agent"
          message={`Supprimer ${deleting.agentName} (${deleting.staffCode}) ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
