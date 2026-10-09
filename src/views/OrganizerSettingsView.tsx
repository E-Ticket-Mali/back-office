import { useRef, useState } from 'react';
import {
  changeOrganizerPassword,
  downloadOwnDocument,
  getOrganizerDocuments,
  getOrganizerProfile,
  updateOrganizerProfile,
  uploadOrganizerDocument,
  type OrganizerDocument,
  type OrganizerDocumentKind,
  type OrganizerProfile,
} from '../api/organizerProfile';
import { useAuth } from '../AuthContext';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { InfoRow, Notice, PasswordChangeCard, PrimaryButton, SettingsCard, TextField } from '../components/SettingsBlocks';
import { StatusBadge, Tabs, type TabDef } from '../components/ui';

type Tab = 'info' | 'kyc' | 'security';

const STATUS: Record<OrganizerProfile['status'], { label: string; color: string; bg: string; help: string }> = {
  PENDING: {
    label: 'En cours de vérification',
    color: '#9A7800',
    bg: 'rgba(252,209,22,0.2)',
    help: "Votre compte est en cours de vérification par l'administration.",
  },
  APPROVED: {
    label: 'Vérifié',
    color: '#164A23',
    bg: 'rgba(22,74,35,0.1)',
    help: 'Votre compte est vérifié : vous pouvez créer, soumettre et publier des événements.',
  },
  REJECTED: { label: 'Rejeté', color: '#CE1126', bg: 'rgba(206,17,38,0.12)', help: "Votre demande a été rejetée par l'administration." },
  SUSPENDED: {
    label: 'Suspendu',
    color: '#A6741D',
    bg: 'rgba(166,116,29,0.12)',
    help: "Votre compte est suspendu : contactez l'administration.",
  },
};

const KIND_LABEL: Record<OrganizerDocumentKind, string> = {
  NIF: 'Justificatif NIF',
  RCCM: 'Justificatif RCCM',
  ID_PIECE: "Pièce d'identité du responsable",
};
const KINDS: OrganizerDocumentKind[] = ['NIF', 'RCCM', 'ID_PIECE'];
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];

const selectStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#1F2E35',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};

function InfoTab({ profile, onSaved }: Readonly<{ profile: OrganizerProfile; onSaved: () => void }>) {
  const { renameSession } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [nif, setNif] = useState('');
  const [rccm, setRccm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canCompleteNif = !profile.nif;
  const canCompleteRccm = !profile.rccm;
  const dirty =
    (name !== null && name.trim() !== profile.name) ||
    (phone !== null && phone.trim() !== (profile.phone ?? '')) ||
    (canCompleteNif && nif.trim() !== '') ||
    (canCompleteRccm && rccm.trim() !== '');

  const save = async () => {
    setError(null);
    setSaved(false);
    try {
      const updated = await updateOrganizerProfile({
        name: name !== null ? name.trim() : undefined,
        phone: phone !== null ? phone.trim() : undefined,
        nif: canCompleteNif && nif.trim() ? nif.trim() : undefined,
        rccm: canCompleteRccm && rccm.trim() ? rccm.trim() : undefined,
      });
      renameSession(updated.name);
      setName(null);
      setPhone(null);
      setNif('');
      setRccm('');
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    }
  };

  return (
    <>
      <SettingsCard title="Informations de l'organisation" hint="Ces informations sont visibles par l'administration de la plateforme." testId="org-info-card">
        <TextField id="org-name" label="Nom de l'organisation" value={name ?? profile.name} onChange={setName} />
        <TextField id="org-phone" label="Téléphone" value={phone ?? profile.phone ?? ''} onChange={setPhone} />
        {canCompleteNif && <TextField id="org-nif" label="NIF (à compléter)" value={nif} onChange={setNif} placeholder="Numéro d'identification fiscale" />}
        {canCompleteRccm && <TextField id="org-rccm" label="RCCM (à compléter)" value={rccm} onChange={setRccm} placeholder="Registre du commerce" />}
        <PrimaryButton label="Enregistrer" onClick={save} disabled={!dirty} />
        {error && <Notice kind="error">{error}</Notice>}
        {saved && <Notice kind="success">Informations enregistrées.</Notice>}
      </SettingsCard>

      <SettingsCard title="Compte" hint="Ces éléments sont vérifiés par l'administration : contactez-la pour les faire modifier.">
        <InfoRow label="E-mail (identifiant de connexion)" value={profile.email} />
        <InfoRow label="NIF" value={profile.nif ?? '—'} />
        <InfoRow label="RCCM" value={profile.rccm ?? '—'} />
        <InfoRow
          label="Taux de commission"
          value={profile.commissionRate != null ? `${profile.commissionRate} %` : 'Taux par défaut de la plateforme (10 %)'}
        />
        <InfoRow label="Compte créé le" value={new Date(profile.createdAt).toLocaleDateString('fr-FR')} last />
      </SettingsCard>
    </>
  );
}

function CheckLine({ done, label }: Readonly<{ done: boolean; label: string }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontSize: 13 }}>
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: '#FFFFFF',
          background: done ? '#164A23' : '#C9BFAF',
          flexShrink: 0,
        }}
      >
        {done ? '✓' : ''}
      </span>
      <span style={{ color: done ? '#1F2E35' : '#6B6459' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: done ? '#164A23' : '#A6741D' }}>{done ? 'Fourni' : 'À fournir'}</span>
    </div>
  );
}

function KycTab({ profile }: Readonly<{ profile: OrganizerProfile }>) {
  const { data: documents, loading, error, reload } = useCollection(getOrganizerDocuments);
  const [kind, setKind] = useState<OrganizerDocumentKind>('NIF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (loading) return <LoadingState label="Chargement de la vérification…" />;
  if (error) return <ErrorState message={error} />;

  const has = (k: OrganizerDocumentKind) => documents.some((d) => d.kind === k);
  const status = STATUS[profile.status];
  const steps = [
    { done: Boolean(profile.nif), label: 'Numéro NIF renseigné' },
    { done: Boolean(profile.rccm), label: 'Numéro RCCM renseigné' },
    ...KINDS.map((k) => ({ done: has(k), label: KIND_LABEL[k] })),
  ];
  const doneCount = steps.filter((s) => s.done).length;

  const pick = (next: File | undefined) => {
    setUploadError(null);
    setUploaded(false);
    if (!next) return;
    if (!ACCEPTED.includes(next.type)) return setUploadError('Formats acceptés : PDF, JPG ou PNG.');
    if (next.size > MAX_BYTES) return setUploadError('Le document ne doit pas dépasser 5 Mo.');
    setFile(next);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      await uploadOrganizerDocument(kind, file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setUploaded(true);
      reload();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const download = (doc: OrganizerDocument) =>
    downloadOwnDocument(doc, `${doc.kind.toLowerCase()}-${doc.uploadedAt.slice(0, 10)}`).catch((e: unknown) =>
      setUploadError(e instanceof Error ? e.message : 'Téléchargement impossible.'),
    );

  return (
    <>
      <SettingsCard title="Vérification de l'organisateur" testId="kyc-status-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
          <StatusBadge label={status.label} color={status.color} bg={status.bg} />
          <span style={{ fontSize: 13, color: '#4F5048' }}>{status.help}</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#6B6459', margin: '10px 0 6px' }}>
          Dossier : {doneCount} élément(s) sur {steps.length}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#E7DED0', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${Math.round((doneCount / steps.length) * 100)}%`, height: '100%', background: '#164A23' }} />
        </div>
        {steps.map((s) => (
          <CheckLine key={s.label} done={s.done} label={s.label} />
        ))}
      </SettingsCard>

      <SettingsCard
        title="Déposer un justificatif"
        hint="PDF, JPG ou PNG, 5 Mo maximum. Un justificatif déposé ne peut pas être retiré : l'administration doit pouvoir relire ce qu'elle a vérifié. Vous pouvez en déposer un plus récent."
        testId="kyc-upload-card"
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select aria-label="Type de justificatif" value={kind} onChange={(e) => setKind(e.target.value as OrganizerDocumentKind)} style={selectStyle}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            aria-label="Fichier du justificatif"
            onChange={(e) => pick(e.target.files?.[0])}
            style={{ fontSize: 13, flex: 1, minWidth: 220 }}
          />
          <PrimaryButton label="Déposer" onClick={upload} disabled={!file || busy} />
        </div>
        {uploadError && <Notice kind="error">{uploadError}</Notice>}
        {uploaded && <Notice kind="success">Justificatif déposé : l'administration en est informée.</Notice>}
      </SettingsCard>

      <SettingsCard title={`Justificatifs déposés (${documents.length})`} testId="kyc-documents-card">
        {documents.length === 0 && <div style={{ fontSize: 13, color: '#6B6459' }}>Aucun justificatif déposé pour le moment.</div>}
        <div style={{ display: 'grid', gap: 8 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                background: '#FAF3EB',
                borderRadius: 8,
                fontSize: 13,
                flexWrap: 'wrap',
              }}
            >
              <span>
                <strong>{KIND_LABEL[doc.kind]}</strong>
                <span style={{ color: '#6B6459' }}> · déposé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
              </span>
              <button
                type="button"
                onClick={() => void download(doc)}
                style={{ border: '1px solid #164A23', background: 'transparent', color: '#164A23', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5 }}
              >
                Télécharger
              </button>
            </div>
          ))}
        </div>
      </SettingsCard>
    </>
  );
}

/** ORGANIZER › Paramètres : informations, vérification (KYC) et sécurité du compte. */
export function OrganizerSettingsView() {
  const { data: rows, loading, error, reload } = useCollection(() => getOrganizerProfile().then((p) => [p]));
  const [tab, setTab] = useState<Tab>('info');

  if (loading) return <LoadingState label="Chargement des paramètres…" />;
  if (error) return <ErrorState message={error} />;
  const profile = rows[0];
  if (!profile) return <ErrorState message="Profil indisponible." />;

  const tabs: TabDef<Tab>[] = [
    { id: 'info', label: 'Informations' },
    { id: 'kyc', label: 'Vérification' },
    { id: 'security', label: 'Sécurité' },
  ];

  return (
    <div className="bo-page">
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'info' && <InfoTab profile={profile} onSaved={reload} />}
      {tab === 'kyc' && <KycTab profile={profile} />}
      {tab === 'security' && <PasswordChangeCard onSubmit={changeOrganizerPassword} />}
    </div>
  );
}
