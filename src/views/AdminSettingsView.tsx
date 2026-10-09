import { useState } from 'react';
import { changeAdminPassword, getAdminProfile, getPlatformSettings, updateAdminProfile } from '../api/adminProfile';
import { useAuth } from '../AuthContext';
import { useCollection } from '../hooks/useCollection';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { InfoRow, Notice, PasswordChangeCard, PrimaryButton, SettingsCard, TextField } from '../components/SettingsBlocks';
import { Tabs, type TabDef } from '../components/ui';
import { SecurityView } from './SecurityView';

type Tab = 'account' | 'security' | 'platform';

const TABS: TabDef<Tab>[] = [
  { id: 'account', label: 'Mon compte' },
  { id: 'security', label: 'Sécurité' },
  { id: 'platform', label: 'Plateforme' },
];

function sessionDuration(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} jour(s)`;
  if (minutes % 60 === 0) return `${minutes / 60} heure(s)`;
  return `${minutes} minute(s)`;
}

function AccountTab() {
  const { renameSession } = useAuth();
  const { data: rows, loading, error, reload } = useCollection(() => getAdminProfile().then((p) => [p]));
  const [name, setName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) return <LoadingState label="Chargement du compte…" />;
  if (error) return <ErrorState message={error} />;
  const profile = rows[0];
  if (!profile) return <ErrorState message="Compte indisponible." />;

  const saveName = async () => {
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateAdminProfile((name ?? profile.name).trim());
      renameSession(updated.name);
      setName(null);
      setSaved(true);
      reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    }
  };

  return (
    <>
      <SettingsCard title="Mon compte" hint="Votre nom apparaît dans l'historique des décisions (validations, rejets, reversements)." testId="account-card">
        <TextField id="admin-name" label="Nom affiché" value={name ?? profile.name} onChange={setName} />
        <PrimaryButton label="Enregistrer" onClick={saveName} disabled={name === null || name.trim() === '' || name.trim() === profile.name} />
        {saveError && <Notice kind="error">{saveError}</Notice>}
        {saved && <Notice kind="success">Nom mis à jour.</Notice>}
        <div style={{ marginTop: 18 }}>
          <InfoRow label="E-mail (identifiant de connexion)" value={profile.email} />
          <InfoRow label="Rôle" value="Administrateur" />
          <InfoRow label="Double authentification" value={profile.mfaEnabled ? 'Activée' : 'Désactivée'} />
          <InfoRow
            label="Compte créé le"
            value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '—'}
            last
          />
        </div>
      </SettingsCard>
      <PasswordChangeCard onSubmit={changeAdminPassword} />
    </>
  );
}

function PlatformTab() {
  const { data: rows, loading, error } = useCollection(() => getPlatformSettings().then((s) => [s]));
  if (loading) return <LoadingState label="Chargement des règles de la plateforme…" />;
  if (error) return <ErrorState message={error} />;
  const settings = rows[0];
  if (!settings) return <ErrorState message="Règles indisponibles." />;

  return (
    <SettingsCard
      title="Règles de la plateforme"
      hint="Valeurs réellement appliquées par le serveur. Elles se règlent au déploiement ; le taux de commission se personnalise par organisateur dans Finances → Commissions."
      testId="platform-card"
    >
      <InfoRow label="Commission par défaut sur les ventes d'un organisateur" value={`${settings.defaultCommissionRate} %`} />
      <InfoRow label="Frais de service ajoutés au prix payé par le client" value={`${settings.serviceFeeRate} %`} />
      <InfoRow label="Durée d'une session avant reconnexion" value={sessionDuration(settings.sessionMinutes)} />
      <InfoRow label="Taille maximale d'un justificatif" value={`${settings.maxDocumentSizeMb} Mo (PDF, JPG, PNG)`} />
      <InfoRow label="Taille maximale d'une image d'événement" value={`${settings.maxImageSizeMb} Mo (PNG, JPEG)`} last />
    </SettingsCard>
  );
}

/** ADMIN › Paramètres : compte, sécurité (double authentification) et règles de la plateforme. */
export function AdminSettingsView() {
  const [tab, setTab] = useState<Tab>('account');
  return (
    <div className="bo-page">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'account' && <AccountTab />}
      {tab === 'security' && <SecurityView />}
      {tab === 'platform' && <PlatformTab />}
    </div>
  );
}
