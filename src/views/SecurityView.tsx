import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { confirmMfa, disableMfa, getMfaStatus, setupMfa } from '../api/auth';
import { LoadingState } from '../components/LoadingState';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 12,
  padding: 24,
  maxWidth: 480,
  boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 15,
  letterSpacing: 4,
  textAlign: 'center',
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  background: '#164A23',
  color: '#FAF3EB',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

const dangerBtn = (disabled: boolean): React.CSSProperties => ({
  background: 'transparent',
  color: '#A6341D',
  border: '1px solid #A6341D',
  padding: '10px 20px',
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

const errorBanner: React.CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #F5DCD4',
  background: '#FBEDE8',
  color: '#8A2E17',
  fontSize: 12.5,
  fontWeight: 600,
};

export function SecurityView() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rendered entirely client-side (no network call) — the otpauth:// URI carries the raw TOTP
  // secret, which must never leave the browser (e.g. to a third-party QR-image service).
  useEffect(() => {
    if (!setup) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(setup.otpauthUri, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [setup]);

  const reload = () => {
    setLoading(true);
    getMfaStatus()
      .then((res) => setEnabled(res.enabled))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  if (loading || enabled === null) return <LoadingState label="Chargement…" />;

  const startSetup = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await setupMfa();
      setSetup(res);
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de démarrer la configuration.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await confirmMfa(code);
      setSetup(null);
      setCode('');
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setError(null);
    setBusy(true);
    try {
      await disableMfa(code);
      setCode('');
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bo-page">
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
          Double authentification (MFA)
        </div>
        <div style={{ fontSize: 13, color: '#6B6459', marginBottom: 20 }}>
          Protégez votre compte administrateur avec un code à usage unique généré par une
          application d'authentification (Google Authenticator, Authy, 1Password…).
        </div>

        {enabled && !setup && (
          <>
            <div style={{ fontSize: 13, color: '#164A23', fontWeight: 600, marginBottom: 16 }}>
              ✓ Activée sur ce compte
            </div>
            <div style={{ fontSize: 12.5, color: '#6B6459', marginBottom: 10 }}>
              Entrez un code actuel pour la désactiver :
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              style={{ ...inputStyle, marginBottom: 12 }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button type="button" disabled={busy || code.length !== 6} onClick={disable} style={dangerBtn(busy || code.length !== 6)}>
              Désactiver la MFA
            </button>
          </>
        )}

        {!enabled && !setup && (
          <button type="button" disabled={busy} onClick={startSetup} style={primaryBtn(busy)}>
            Activer la double authentification
          </button>
        )}

        {setup && (
          <>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              1. Scannez ce QR code avec votre application d'authentification :
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code MFA" width={220} height={220} />
              ) : (
                <div style={{ fontSize: 12, color: '#6B6459' }}>Génération du QR code…</div>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: '#6B6459', marginBottom: 16, textAlign: 'center' }}>
              Impossible de scanner ? Entrez ce code manuellement : <code>{setup.secret}</code>
            </div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>2. Entrez le code généré pour confirmer :</div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              style={{ ...inputStyle, marginBottom: 12 }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" disabled={busy || code.length !== 6} onClick={confirm} style={primaryBtn(busy || code.length !== 6)}>
                Confirmer l'activation
              </button>
              <button
                type="button"
                onClick={() => {
                  setSetup(null);
                  setCode('');
                  setError(null);
                }}
                style={{ background: 'transparent', border: 'none', color: '#6B6459', fontSize: 12.5, cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </>
        )}

        {error && <div style={errorBanner}>{error}</div>}
      </div>
    </div>
  );
}
