import { TableView } from '../components/table/TableView';
import { badge, detailOnlyActions, plain, type Column, type Row } from '../components/table/types';
import { LoadingState, ErrorState, InlineRefreshHint } from '../components/LoadingState';
import { useState } from 'react';
import { createOrganizer, getOrganizers, type OrganizerCreateInput } from '../api/organizers';
import { FormPage } from '../components/FormPage';
import { EntityForm, type FieldDef, type FormValues } from '../components/EntityForm';
import { SuccessPanel } from '../components/SuccessPanel';
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

const CREATE_FIELDS: FieldDef[] = [
  { key: 'name', label: "Nom de l'organisateur", type: 'text' },
  { key: 'email', label: 'E-mail (identifiant de connexion)', type: 'text' },
  { key: 'phone', label: 'Téléphone', type: 'tel' },
  { key: 'password', label: 'Mot de passe initial (8 caractères min.)', type: 'password' },
  { key: 'nif', label: 'NIF', type: 'text', optional: true },
  { key: 'rccm', label: 'RCCM', type: 'text', optional: true },
  { key: 'commissionRate', label: 'Taux de commission % (vide = défaut 10 %)', type: 'text', optional: true, fullWidth: true },
];

const EMPTY = { name: '', email: '', phone: '', password: '', nif: '', rccm: '', commissionRate: '' };

/** Valide la saisie et la convertit pour l'API ; lève une erreur lisible sinon. */
function toCreateInput(values: FormValues): OrganizerCreateInput {
  const text = (key: string) => String(values[key] ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('email'))) throw new Error('Adresse e-mail invalide.');
  if (String(values.password ?? '').length < 8) throw new Error('Le mot de passe initial doit contenir au moins 8 caractères.');
  const input: OrganizerCreateInput = { name: text('name'), email: text('email'), phone: text('phone'), password: String(values.password) };
  if (text('nif')) input.nif = text('nif');
  if (text('rccm')) input.rccm = text('rccm');
  if (text('commissionRate')) {
    const rate = Number(text('commissionRate').replace(',', '.'));
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error('Le taux de commission doit être compris entre 0 et 100.');
    input.commissionRate = rate;
  }
  return input;
}

interface OrganizersViewProps {
  filters: TableFilters;
  onOpenDetail: (organizer: AdminOrganizer) => void;
}

export function OrganizersView(props: Readonly<OrganizersViewProps>) {
  const { filters, onOpenDetail } = props;
  const { data: organizers, loading, refreshing, error, reload } = useCollection(getOrganizers);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string } | null>(null);

  const closeModal = () => {
    setCreating(false);
    setCreated(null);
  };

  const submit = async (values: FormValues) => {
    const organizer = await createOrganizer(toCreateInput(values));
    setCreated({ name: organizer.name, email: organizer.email });
    reload();
  };

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
      {!creating && (
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
        onCreate={() => setCreating(true)}
        createLabel="+ Nouvel organisateur"
      />
      )}

      {creating && (
        <FormPage
          title="Nouvel organisateur"
          backLabel="Retour aux organisateurs"
          onBack={closeModal}
          intro="Le compte est créé directement approuvé, sans pièce justificative : l'organisateur peut se connecter tout de suite. La création est tracée dans l'historique des décisions."
        >
          {created ? (
            <SuccessPanel
              message={`Organisateur ${created.name} créé et approuvé. Transmettez-lui son identifiant (${created.email}) et le mot de passe initial : il pourra le changer dans ses paramètres.`}
              onClose={closeModal}
            />
          ) : (
            <EntityForm fields={CREATE_FIELDS} initialValues={EMPTY} submitLabel="Créer l'organisateur" onSubmit={submit} onCancel={closeModal} columns={2} />
          )}
        </FormPage>
      )}
    </>
  );
}
