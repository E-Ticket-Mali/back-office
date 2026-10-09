import { PasswordInput } from '../components/PasswordInput';
import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Icon } from '../components/Icon';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B6459',
  marginBottom: 6,
  display: 'block',
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E7DED0',
  borderRadius: 14,
  padding: '40px 44px',
  width: 380,
  maxWidth: '92vw',
  boxShadow: '0 10px 30px rgba(31,46,53,0.1)',
};

const errorBanner: React.CSSProperties = {
  marginBottom: 16,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #F5DCD4',
  background: '#FBEDE8',
  color: '#8A2E17',
  fontSize: 12.5,
  fontWeight: 600,
};

const submitButton = (loading: boolean): React.CSSProperties => ({
  width: '100%',
  background: '#164A23',
  color: '#FAF3EB',
  border: 'none',
  padding: '11px 24px',
  borderRadius: 8,
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14,
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
});

function Logo() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#164A23',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="event" size={24} color="#FAF3EB" />
      </div>
    </div>
  );
}

function MfaStep() {
  const { pendingMfa, completeMfa, cancelMfa, loading, error } = useAuth();
  const [code, setCode] = useState('');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', background: '#FAF3EB' }}>
      <div style={cardStyle}>
        <Logo />
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 800, color: '#1F2E35', marginBottom: 6, textAlign: 'center' }}>
          Vérification en deux étapes
        </div>
        <div style={{ fontSize: 13, color: '#6B6459', marginBottom: 20, textAlign: 'center' }}>
          Entrez le code à 6 chiffres généré par votre application d'authentification pour{' '}
          <strong>{pendingMfa?.email}</strong>.
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await completeMfa(code);
            } catch {
              // error surfaced via useAuth().error
            }
          }}
        >
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle} htmlFor="mfa-code">
              Code d'authentification
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              style={{ ...inputStyle, letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>

          {error && <div style={errorBanner}>{error}</div>}

          <button type="submit" disabled={loading || code.length !== 6} style={submitButton(loading || code.length !== 6)}>
            {loading ? 'Vérification…' : 'Vérifier'}
          </button>
          <button
            type="button"
            onClick={cancelMfa}
            style={{ width: '100%', marginTop: 10, background: 'transparent', border: 'none', color: '#6B6459', fontSize: 12.5, cursor: 'pointer' }}
          >
            ‹ Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  );
}

export function LoginView() {
  const { login, pendingMfa, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (pendingMfa) return <MfaStep />;

  return (
    <div
      className="bo-login-screen"
      style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', background: '#FAF3EB' }}
    >
      <div className="bo-login-card" style={cardStyle}>
        <Logo />
        <div
          style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: 20,
            fontWeight: 800,
            color: '#1F2E35',
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          E-Ticket — Back-office
        </div>
        <div style={{ fontSize: 13, color: '#6B6459', marginBottom: 28, textAlign: 'center' }}>
          Connectez-vous avec votre compte.
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await login(email, password);
            } catch {
              // error surfaced via useAuth().error
            }
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="login-email">
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle} htmlFor="login-password">
              Mot de passe
            </label>
            <PasswordInput id="login-password" style={inputStyle} value={password} onChange={setPassword} autoComplete="current-password" />
          </div>

          {error && <div style={errorBanner}>{error}</div>}

          <button type="submit" disabled={loading} style={submitButton(loading)}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
