import { useState } from 'react';
import { TicketCategoryModal } from './TicketCategoryModal';
import { newTicketDraft, type TicketDraft } from '../utils/ticketDrafts';

type TicketCategoriesFieldProps = Readonly<{
  value: TicketDraft[];
  onChange: (next: TicketDraft[]) => void;
}>;

const smallButton = (color: string): React.CSSProperties => ({
  padding: '5px 10px',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
});

function formatPrice(price: string): string {
  const n = Number(price);
  return n === 0 ? 'Gratuit' : `${n.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Section « Billetterie » du formulaire d'événement : liste des catégories de billets avec création
 * rapide en fenêtre modale. Une catégorie créée est ajoutée automatiquement à l'événement.
 */
export function TicketCategoriesField({ value, onChange }: TicketCategoriesFieldProps) {
  const [editing, setEditing] = useState<TicketDraft | 'new' | null>(null);

  return (
    <div data-testid="ticket-categories-field">
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 6, display: 'block' }}>
        Catégories de billets <span style={{ color: '#A6341D' }}>*</span>
      </span>

      {value.length === 0 ? (
        <div style={{ padding: '14px 16px', border: '1px dashed #E7DED0', borderRadius: 10, fontSize: 13, color: '#6B6459' }}>
          Aucune catégorie de billet pour le moment.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {value.map((d) => (
            <div
              key={d.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 14px',
                background: '#FAF3EB',
                borderRadius: 8,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1F2E35' }}>{d.name}</div>
                <div style={{ fontSize: 12, color: '#6B6459' }}>
                  {formatPrice(d.price)} · {d.capacity.trim() === '' ? 'illimité' : `${d.capacity} billets`}
                  {d.description ? ` · ${d.description}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={smallButton('#164A23')} onClick={() => setEditing(d)}>
                  Modifier
                </button>
                <button
                  type="button"
                  style={smallButton('#A6341D')}
                  aria-label={`Retirer la catégorie ${d.name}`}
                  onClick={() => onChange(value.filter((x) => x.key !== d.key))}
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing('new')}
        style={{
          marginTop: 10,
          padding: '7px 14px',
          borderRadius: 8,
          border: '1px dashed #164A23',
          background: 'transparent',
          color: '#164A23',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + {value.length === 0 ? 'Créer une catégorie de billet' : 'Ajouter une catégorie de billet'}
      </button>

      {editing && (
        <TicketCategoryModal
          inline={editing === 'new'}
          title={editing === 'new' ? 'Créer une catégorie de billet' : 'Modifier la catégorie'}
          submitLabel={editing === 'new' ? 'Créer' : 'Enregistrer'}
          initial={editing === 'new' ? undefined : { name: editing.name, price: editing.price, capacity: editing.capacity, description: editing.description }}
          onClose={() => setEditing(null)}
          onSubmit={(payload, values) => {
            const lower = payload.name.toLowerCase();
            if (value.some((d) => d !== editing && d.name.trim().toLowerCase() === lower)) {
              throw new Error(`La catégorie « ${payload.name} » existe déjà.`);
            }
            if (editing === 'new') onChange([...value, { ...newTicketDraft(), ...values }]);
            else onChange(value.map((d) => (d === editing ? { ...d, ...values } : d)));
          }}
        />
      )}
    </div>
  );
}
