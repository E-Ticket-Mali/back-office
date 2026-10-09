import { Icon } from './Icon';

type FormPageProps = Readonly<{
  /** Titre de la page (ex. « Nouvel organisateur »). */
  title: string;
  /** Phrase d'aide sous le titre : ce que la création va produire. */
  intro?: React.ReactNode;
  /** Libellé du lien de retour (ex. « Retour aux organisateurs »). */
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
}>;

/**
 * Gabarit des pages de création du back-office. Convention : toute création se fait dans une page
 * dédiée — jamais dans une fenêtre modale, réservée aux confirmations et décisions courtes.
 */
export function FormPage({ title, intro, backLabel, onBack, children }: FormPageProps) {
  return (
    <div className="bo-page" data-testid="form-page">
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#164A23',
          cursor: 'pointer',
          marginBottom: 14,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        <Icon name="back" size={15} /> {backLabel}
      </button>
      <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800, color: '#1F2E35', margin: '0 0 6px' }}>{title}</h1>
      {intro && <p style={{ fontSize: 13, color: '#6B6459', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 720 }}>{intro}</p>}
      <div
        className="bo-card"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7DED0',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
          maxWidth: 860,
          marginTop: intro ? 0 : 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}
