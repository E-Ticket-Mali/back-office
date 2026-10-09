import { useState } from 'react';
import { Icon } from './Icon';

type PasswordInputProps = Readonly<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Style du champ (celui des autres champs du formulaire) ; la place de l'icône est réservée à droite. */
  style?: React.CSSProperties;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}>;

/** Champ mot de passe avec un « œil » pour afficher / masquer la saisie en clair. */
export function PasswordInput({ id, value, onChange, style, placeholder, required, autoComplete }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', width: style?.width ?? '100%', marginBottom: style?.marginBottom }}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        style={{ ...style, width: '100%', marginBottom: 0, paddingRight: 42, boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        style={{
          position: 'absolute',
          top: '50%',
          right: 8,
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          border: 'none',
          borderRadius: 6,
          background: 'transparent',
          color: '#6B6459',
          cursor: 'pointer',
        }}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={17} />
      </button>
    </div>
  );
}
