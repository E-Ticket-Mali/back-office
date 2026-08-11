import { useEffect, useRef, useState } from 'react';

interface ProfileMenuProps {
  name: string;
  role: string;
  initials: string;
  onLogout: () => void;
}

export function ProfileMenu({ name, role, initials, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 14px 5px 5px',
          borderRadius: 999,
          background: '#FAF3EB',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#E9D3A8',
            border: '2px solid #164A23',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Poppins',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: '#0F3419',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', color: '#1F2E35' }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: '#6B6459', whiteSpace: 'nowrap' }}>{role}</div>
        </div>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            width: 200,
            background: '#FFFFFF',
            border: '1px solid #E7DED0',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(31,46,53,0.18)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E7DED0' }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: '#1F2E35' }}>{name}</div>
            <div style={{ fontSize: 11.5, color: '#6B6459', marginTop: 2 }}>{role}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '11px 16px',
              border: 'none',
              background: 'transparent',
              color: '#A6341D',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
