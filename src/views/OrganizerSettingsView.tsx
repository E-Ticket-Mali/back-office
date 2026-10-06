import { useState } from 'react';
import { changeOrganizerPassword, getOrganizerProfile, updateOrganizerProfile } from '../api/organizerProfile';
import { useCollection } from '../hooks/useCollection';
import { useActionError } from '../hooks/useActionError';
import { LoadingState } from '../components/LoadingState';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 22,
  maxWidth: 480,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
  marginBottom: 18,
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B6459',
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13,
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  marginBottom: 14,
};

const readOnlyRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '9px 0',
  borderBottom: '1px solid #F1EAE0',
  fontSize: 13,
};

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  background: '#164A23',
  color: '#FAF3EB',
  border: 'none',
  padding: '9px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente de validation',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
};

export function OrganizerSettingsView() {
  const { data: rows, loading, reload } = useCollection(() => getOrganizerProfile().then((p) => [p]));
  const { run, banner } = useActionError();

  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (loading || rows.length === 0) return <LoadingState label="Chargement du profil…" />;
  const profile = rows[0];

  const saveInfo = () =>
    run(async () => {
      await updateOrganizerProfile({
        name: name ?? undefined,
        phone: phone ?? undefined,
      });
      setName(null);
      setPhone(null);
      reload();
    });

  const savePassword = () =>
    run(async () => {
      if (newPassword.length < 8) throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      await changeOrganizerPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    });

  return (
    <div className="bo-page">
      {banner}

      <div style={cardStyle}>
        <div style={cardTitleStyle}>Informations de l'organisation</div>

        <label style={labelStyle} htmlFor="org-name">
          Nom de l'organisation
        </label>
        <input
          id="org-name"
          style={inputStyle}
          value={name ?? profile.name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={labelStyle} htmlFor="org-phone">
          Téléphone
        </label>
        <input
          id="org-phone"
          style={inputStyle}
          value={phone ?? profile.phone ?? ''}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button type="button" onClick={saveInfo} style={primaryBtn(false)}>
          Enregistrer
        </button>

        <div style={{ marginTop: 20 }}>
          <div style={readOnlyRow}>
            <span style={{ color: '#6B6459' }}>E-mail</span>
            <span style={{ fontWeight: 600 }}>{profile.email}</span>
          </div>
          <div style={readOnlyRow}>
            <span style={{ color: '#6B6459' }}>NIF</span>
            <span style={{ fontWeight: 600 }}>{profile.nif ?? '—'}</span>
          </div>
          <div style={readOnlyRow}>
            <span style={{ color: '#6B6459' }}>RCCM</span>
            <span style={{ fontWeight: 600 }}>{profile.rccm ?? '—'}</span>
          </div>
          <div style={readOnlyRow}>
            <span style={{ color: '#6B6459' }}>Statut</span>
            <span style={{ fontWeight: 600 }}>{STATUS_LABEL[profile.status] ?? profile.status}</span>
          </div>
          <div style={{ ...readOnlyRow, borderBottom: 'none' }}>
            <span style={{ color: '#6B6459' }}>Taux de commission</span>
            <span style={{ fontWeight: 600 }}>{profile.commissionRate != null ? `${profile.commissionRate}%` : '—'}</span>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: '#6B6459', marginTop: 10 }}>
          E-mail, NIF, RCCM et statut sont vérifiés par l'équipe Mali E-Ticket — contactez le support pour les modifier.
        </div>
      </div>

      <div style={cardStyle}>
        <div style={cardTitleStyle}>Changer le mot de passe</div>
        <label style={labelStyle} htmlFor="current-password">
          Mot de passe actuel
        </label>
        <input
          id="current-password"
          type="password"
          style={inputStyle}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <label style={labelStyle} htmlFor="new-password">
          Nouveau mot de passe
        </label>
        <input
          id="new-password"
          type="password"
          style={inputStyle}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="button" disabled={!currentPassword || !newPassword} onClick={savePassword} style={primaryBtn(!currentPassword || !newPassword)}>
          Mettre à jour le mot de passe
        </button>
        {passwordSaved && <div style={{ marginTop: 10, fontSize: 12.5, color: '#164A23', fontWeight: 600 }}>Mot de passe mis à jour.</div>}
      </div>
    </div>
  );
}
