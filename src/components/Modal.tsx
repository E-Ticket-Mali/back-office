import type { ReactNode } from 'react';
import { Icon } from './Icon';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
}

const WIDTHS: Record<ModalSize, number> = {
  sm: 420,
  md: 560,
  lg: 760,
};

export function Modal(props: Readonly<ModalProps>) {
  const { title, onClose, children, size = 'md' } = props;
  return (
    <div
      aria-label={title}
      className="bo-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,46,53,0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        width: '100%',
        height: '100%',
      }}
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'default',
        }}
      />
      <div
        aria-label={title}
        className="bo-modal-panel"
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '26px 28px 28px',
          width: WIDTHS[size],
          maxWidth: '94vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(31,46,53,0.3)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid #E7DED0',
          }}
        >
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 700, color: '#1F2E35' }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid #E7DED0',
              background: '#FAF3EB',
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              color: '#6B6459',
              flexShrink: 0,
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
