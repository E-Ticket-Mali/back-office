import { NotificationBell, type AppNotification } from './NotificationBell';
import { ProfileMenu } from './ProfileMenu';

interface TopbarProps {
  title: string;
  hasSearch: boolean;
  search: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  adminName: string;
  role: string;
  onLogout: () => void;
  /** Ouvre le menu latéral (bouton visible uniquement sur petit écran). */
  onOpenNav: () => void;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Topbar(props: Readonly<TopbarProps>) {
  const { title, hasSearch, search, onSearch, notifications, onMarkAllRead, adminName, role, onLogout, onOpenNav } = props;
  return (
    <div
      className="bo-topbar"
      style={{
        height: 68,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E7DED0',
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      <div className="bo-topbar-lead" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button type="button" className="bo-nav-toggle" data-testid="nav-toggle" aria-label="Ouvrir le menu" onClick={onOpenNav}>
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </button>
        <div className="bo-topbar-title" style={{ fontFamily: "'Poppins',sans-serif", fontSize: 17, fontWeight: 700, color: '#1F2E35' }}>{title}</div>
      </div>
      <div className="bo-topbar-meta" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {hasSearch && (
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={onSearch}
            className="bo-topbar-search"
            style={{
              width: 220,
              padding: '9px 14px',
              border: '1.5px solid #E7DED0',
              borderRadius: 8,
              fontSize: 13,
              background: '#FAF3EB',
              outline: 'none',
              color: '#1F2E35',
            }}
          />
        )}
        <div className="bo-topbar-extra" style={{ width: 1, height: 24, background: '#E7DED0' }} />
        <div className="bo-topbar-extra" style={{ fontSize: 13, color: '#6B6459' }}>
          {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="bo-topbar-extra" style={{ width: 1, height: 24, background: '#E7DED0' }} />
        <NotificationBell notifications={notifications} onMarkAllRead={onMarkAllRead} />
        <div className="bo-topbar-extra" style={{ width: 1, height: 24, background: '#E7DED0' }} />
        <ProfileMenu name={adminName} role={role} initials={initialsOf(adminName) || 'AD'} onLogout={onLogout} />
      </div>
    </div>
  );
}
