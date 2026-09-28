import { useState } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  /** Peut être asynchrone : si elle échoue, le message est affiché et la fenêtre reste ouverte. */
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 72,
  padding: '10px 12px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#1F2E35',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B6459',
  marginBottom: 6,
  display: 'block',
};

export function ConfirmDialog(props: Readonly<ConfirmDialogProps>) {
  const { title, message, onConfirm, onCancel } = props;
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canConfirm = reason.trim().length > 0 && !busy;

  const confirm = async () => {
    if (!canConfirm) return;
    setError(null);
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p style={{ fontSize: 13.5, color: '#1F2E35', marginTop: 0, marginBottom: 18 }}>{message}</p>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle} htmlFor="delete-reason">
          Motif de la suppression <span style={{ color: '#A6341D' }}>*</span>
        </label>
        <textarea
          id="delete-reason"
          style={textareaStyle}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Expliquez pourquoi cet élément est supprimé…"
          autoFocus
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(206,17,38,0.08)', color: '#CE1126', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <div className="bo-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '9px 16px',
            border: '1.5px solid #E7DED0',
            background: 'transparent',
            color: '#6B6459',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!canConfirm}
          style={{
            padding: '9px 18px',
            border: 'none',
            background: canConfirm ? '#A6341D' : '#D9B8AE',
            color: '#FAF3EB',
            borderRadius: 8,
            fontFamily: "'Poppins',sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
          }}
        >
          Supprimer
        </button>
      </div>
    </Modal>
  );
}
