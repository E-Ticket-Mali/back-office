import { Icon } from './Icon';

interface SuccessPanelProps {
  message: string;
  onClose: () => void;
}

export function SuccessPanel(props: Readonly<SuccessPanelProps>) {
  const { message, onClose } = props;
  return (
    <div className="bo-success-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 4px 4px' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#DCE7DD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          color: '#0F3419',
          marginBottom: 16,
        }}
      >
        <Icon name="check" size={28} strokeWidth={2.5} />
      </div>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15.5, fontWeight: 700, color: '#1F2E35', marginBottom: 24 }}>
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '10px 24px',
          border: 'none',
          background: '#164A23',
          color: '#FAF3EB',
          borderRadius: 8,
          fontFamily: "'Poppins',sans-serif",
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Fermer
      </button>
    </div>
  );
}
