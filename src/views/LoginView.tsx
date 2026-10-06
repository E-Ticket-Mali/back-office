import { useState } from 'react';
import { useAuth, type Role } from '../AuthContext';
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

export function LoginView() {
  const { loginAsAdmin, loginAsOrganizer, loading, error } = useAuth();
  const [role, setRole] = useState<Role>('ADMIN');
  const [email, setEmail] = useState('admin@eticket.ml');
  const [password, setPassword] = useState('');
  // The AuthContext's `error` is only cleared at the start of the next login attempt, not when
  // the user switches tabs without submitting — track which role the current error belongs to
  // so a stale admin-login error doesn't linger under the organizer tab (and vice versa).
  const [errorRole, setErrorRole] = useState<Role | null>(null);

  const switchRole = (next: Role) => {
    setRole(next);
    setEmail(next === 'ADMIN' ? 'admin@eticket.ml' : '');
    setPassword('');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    padding: '10px 0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: active ? '#164A23' : '#6B6459',
    borderBottom: active ? '2px solid #164A23' : '2px solid #E7DED0',
    background: 'transparent',
    border: 'none',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: active ? '#164A23' : '#E7DED0',
    fontFamily: 'inherit',
  });

  return (
    <div
      className="bo-login-screen"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF3EB',
      }}
    >
      <div
        className="bo-login-card"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7DED0',
          borderRadius: 14,
          padding: '40px 44px',
          width: 380,
          maxWidth: '92vw',
          boxShadow: '0 10px 30px rgba(31,46,53,0.1)',
        }}
      >
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
              fontSize: 22,
            }}
          >
            <Icon name="event" size={24} color="#FAF3EB" />
          </div>
        </div>
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
          Mali E-Ticket — Back-office
        </div>
        <div style={{ fontSize: 13, color: '#6B6459', marginBottom: 20, textAlign: 'center' }}>
          Connectez-vous avec votre compte {role === 'ADMIN' ? 'administrateur' : 'organisateur'}.
        </div>

        <div
          role="tablist"
          style={{
            display: 'flex',
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === 'ADMIN'}
            disabled={loading}
            onClick={() => switchRole('ADMIN')}
            style={tabStyle(role === 'ADMIN')}
          >
            Administrateur
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'ORGANIZER'}
            disabled={loading}
            onClick={() => switchRole('ORGANIZER')}
            style={tabStyle(role === 'ORGANIZER')}
          >
            Organisateur
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErrorRole(role);
            try {
              if (role === 'ADMIN') {
                await loginAsAdmin(email, password);
              } else {
                await loginAsOrganizer(email, password);
              }
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
            <input
              id="login-password"
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && errorRole === role && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #F5DCD4',
                background: '#FBEDE8',
                color: '#8A2E17',
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
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
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
