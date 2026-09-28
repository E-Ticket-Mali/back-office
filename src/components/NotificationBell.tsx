import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface AppNotification {
  id: number;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export function NotificationBell({ notifications, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) onMarkAllRead();
        }}
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid #E7DED0',
          background: '#FAF3EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: '#A6341D',
              color: '#FAF3EB',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 44,
            width: 320,
            background: '#FFFFFF',
            border: '1px solid #E7DED0',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(31,46,53,0.18)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #E7DED0',
              fontFamily: "'Poppins',sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: '#1F2E35',
            }}
          >
            Notifications
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <div style={{ padding: 16, fontSize: 12.5, color: '#6B6459' }}>Aucune notification.</div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '11px 16px',
                  borderBottom: '1px solid #F2EEE6',
                  background: n.read ? 'transparent' : '#FAF3EB',
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2E35' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#6B6459', marginTop: 2 }}>{n.detail}</div>
                <div style={{ fontSize: 10.5, color: '#A69C8C', marginTop: 4 }}>{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
