import { useState } from 'react';
import { TableView } from '../components/table/TableView';
import { plain, entityActions, type Column, type Row } from '../components/table/types';
import { FormPage } from '../components/FormPage';
import { Modal } from '../components/Modal';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SuccessPanel } from '../components/SuccessPanel';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../api/staff';
import { filterRows } from '../utils/filterRows';
import { useCollection } from '../hooks/useCollection';
import type { TableFilters } from '../hooks/useTableFilters';
import type { StaffAgent } from '../types';

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

interface AgentsViewProps {
  filters: TableFilters;
  onOpenDetail: (agent: StaffAgent) => void;
}

export function AgentsView({ filters, onOpenDetail }: AgentsViewProps) {
  const { data: agents, loading, refreshing, error, reload } = useCollection(getStaff);
  const [editing, setEditing] = useState<StaffAgent | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StaffAgent | null>(null);
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
      await updateStaff(editing.id, { agentName: String(values.agentName) });
      setSuccessMsg(`Agent ${values.agentName} mis à jour avec succès`);
    } else {
      await createStaff({ staffCode: String(values.staffCode), agentName: String(values.agentName) });
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
      await deleteStaff(deleting.id);
      setDeleting(null);
      reload();
    }
  };

  return (
    <>
      {refreshing && <InlineRefreshHint />}
      {editing !== 'new' && (
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
      )}

      {editing === 'new' && (
        <FormPage title="Nouvel agent de contrôle" backLabel="Retour aux agents" onBack={closeModal} intro="L'agent se connecte à l'application de contrôle avec son code. Un agent créé ici peut contrôler tous les événements.">
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
        </FormPage>
      )}

      {editing && editing !== 'new' && (
        <Modal title={successMsg ? 'Confirmation' : "Modifier l'agent"} onClose={closeModal} size="sm">
          {successMsg ? (
            <SuccessPanel message={successMsg} onClose={closeModal} />
          ) : (
            <EntityForm
              fields={EDIT_FIELDS}
              initialValues={editing}
              submitLabel={'Enregistrer'}
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
