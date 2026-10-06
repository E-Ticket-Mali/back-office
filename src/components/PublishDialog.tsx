import { useState } from 'react';
import { Modal } from './Modal';

type PublishDialogProps = Readonly<{
  mode: 'publish' | 'unpublish';
  eventName: string;
  /** Peut échouer : le message est affiché et la fenêtre reste ouverte. */
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;

const COPY = {
  publish: {
    title: "Publier l'événement",
    body: "sera visible dans l'application client et ouvert à la vente immédiatement.",
    confirm: 'Publier',
  },
  unpublish: {
    title: "Dépublier l'événement",
    body: "sera retiré de l'application client et les ventes seront fermées. Les billets déjà vendus restent valides au contrôle. Vous pourrez le republier à tout moment, sans nouvelle validation.",
    confirm: 'Dépublier',
  },
} as const;

/** Confirmation de mise en ligne / retrait — décision de l'organisateur, une fois l'événement validé. */
export function PublishDialog({ mode, eventName, onConfirm, onCancel }: PublishDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[mode];

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
      setBusy(false);
    }
  };

  return (
    <Modal title={copy.title} onClose={onCancel} size="sm">
      <p style={{ fontSize: 13.5, color: '#1F2E35', lineHeight: 1.55, margin: '0 0 16px' }}>
        <strong>{eventName}</strong> {copy.body}
      </p>
      {error && (
        <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(206,17,38,0.08)', color: '#CE1126', fontSize: 13 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '9px 16px', border: '1.5px solid #E7DED0', background: 'transparent', color: '#6B6459', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          style={{
            padding: '9px 18px',
            border: 'none',
            background: mode === 'publish' ? '#164A23' : '#A6341D',
            color: '#FAF3EB',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {copy.confirm}
        </button>
      </div>
    </Modal>
  );
}
