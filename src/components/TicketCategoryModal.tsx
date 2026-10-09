import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './Modal';
import { toTicketPayload, type TicketDraft, type TicketPayload } from '../utils/ticketDrafts';

export type CategoryValues = Omit<TicketDraft, 'key'>;

const EMPTY_CATEGORY: CategoryValues = { name: '', price: '', capacity: '', description: '' };

type TicketCategoryModalProps = Readonly<{
  title: string;
  submitLabel: string;
  initial?: CategoryValues;
  /** Reçoit la catégorie validée ; peut échouer (le message est affiché, la fenêtre reste ouverte). */
  onSubmit: (payload: TicketPayload, values: CategoryValues) => void | Promise<void>;
  onClose: () => void;
  /** Information affichée au-dessus du formulaire (ex. effet d'une modification après vente). */
  notice?: string;
  /** Création : le formulaire s'ouvre en panneau dans la page (convention « pas de modale pour créer »). */
  inline?: boolean;
}>;

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
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 6, display: 'block' };

/**
 * Création / modification rapide d'une catégorie de billet — action courte, donc en fenêtre modale.
 * Volontairement sans balise <form> : la fenêtre s'ouvre depuis le formulaire d'un événement et ne
 * doit pas le soumettre.
 */
export function TicketCategoryModal({ title, submitLabel, initial = EMPTY_CATEGORY, onSubmit, onClose, notice, inline = false }: TicketCategoryModalProps) {
  const [values, setValues] = useState<CategoryValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof CategoryValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onSubmit(toTicketPayload(values), values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  const body = (
      <div style={{ display: 'grid', gap: 14 }} onKeyDown={onEnter}>
        {notice && (
          <div style={{ fontSize: 12.5, color: '#6B6459', background: '#FAF3EB', borderRadius: 8, padding: '10px 12px' }}>{notice}</div>
        )}
        <div>
          <label style={labelStyle} htmlFor="category-name">
            Nom
          </label>
          <input
            id="category-name"
            style={inputStyle}
            placeholder="Standard, VIP, Carré Or…"
            value={values.name}
            maxLength={80}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="category-price">
              Prix (FCFA)
            </label>
            <input
              id="category-price"
              style={inputStyle}
              type="number"
              min={0}
              step="any"
              placeholder="0 = gratuit"
              value={values.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="category-capacity">
              Quantité disponible
            </label>
            <input
              id="category-capacity"
              style={inputStyle}
              type="number"
              min={1}
              step={1}
              placeholder="Illimitée"
              value={values.capacity}
              onChange={(e) => set('capacity', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle} htmlFor="category-description">
            Description (facultative)
          </label>
          <input
            id="category-description"
            style={inputStyle}
            placeholder="Accès standard à l'événement"
            value={values.description}
            maxLength={255}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        {error && (
          <div role="alert" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(206,17,38,0.08)', color: '#CE1126', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 18px', border: '1.5px solid #E7DED0', background: 'transparent', color: '#6B6459', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            style={{
              opacity: busy ? 0.6 : 1,
              padding: '10px 20px',
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
            {submitLabel}
          </button>
        </div>
      </div>
  );

  if (inline) {
    return (
      <section
        role="group"
        aria-label={title}
        data-testid="category-panel"
        style={{ marginTop: 12, padding: 18, border: '1.5px solid #164A23', borderRadius: 12, background: '#FFFFFF' }}
      >
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14.5, fontWeight: 700, color: '#1F2E35', marginBottom: 14 }}>{title}</div>
        {body}
      </section>
    );
  }

  return createPortal(
    <Modal title={title} onClose={onClose} size="sm">
      {body}
    </Modal>,
    document.body,
  );
}
