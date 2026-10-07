import { useEffect, useRef, useState } from 'react';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

type CoverFieldProps = Readonly<{
  /** Fichier choisi dans le formulaire, envoyé à l'enregistrement ; null = rien de nouveau. */
  file: File | null;
  onChange: (file: File | null) => void;
  /** Couverture actuellement enregistrée (modification d'un événement existant). */
  currentUrl?: string | null;
  /** Visuel de l'événement, proposé comme couverture sur demande explicite (jamais automatiquement). */
  logoFile?: File | null;
}>;

/** Image de couverture (paysage 16:9) : affichée en tête de la page de détail de l'événement.
 * Distincte du visuel de liste ; obligatoire pour publier. */
export function CoverField({ file, onChange, currentUrl, logoFile }: CoverFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (next: File | undefined) => {
    setError(null);
    if (!next) return;
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setError('Formats acceptés : PNG ou JPEG.');
      return;
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setError("L'image ne doit pas dépasser 8 Mo.");
      return;
    }
    onChange(next);
  };

  const shown = previewUrl ?? currentUrl ?? null;

  return (
    <div data-testid="cover-field">
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 2, display: 'block' }}>
        Image de couverture
      </span>
      <span style={{ fontSize: 11.5, color: '#6B6459', marginBottom: 8, display: 'block' }}>
        Image large (16:9) affichée en haut de la page de détail de l&apos;événement. Requise pour publier.
      </span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 240,
            aspectRatio: '16 / 9',
            borderRadius: 10,
            border: '1.5px dashed #E7DED0',
            background: '#FAF3EB',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 11.5,
            color: '#6B6459',
          }}
        >
          {shown ? (
            <img src={shown} alt="Aperçu de la couverture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            'Aucune couverture'
          )}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          {file && (
            <div style={{ fontSize: 12, color: '#6B6459', marginBottom: 8 }} data-testid="cover-caption">
              {file.name}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            aria-label="Importer une image de couverture"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #164A23',
                background: 'transparent',
                color: '#164A23',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {shown ? 'Remplacer la couverture' : 'Importer une couverture (PNG/JPEG, 8 Mo max)'}
            </button>
            {logoFile && file !== logoFile && (
              <button
                type="button"
                onClick={() => onChange(logoFile)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px dashed #6B6459',
                  background: 'transparent',
                  color: '#6B6459',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Utiliser le visuel comme couverture
              </button>
            )}
            {file && (
              <button
                type="button"
                onClick={() => onChange(null)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #E7DED0',
                  background: 'transparent',
                  color: '#A6341D',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            )}
          </div>
          {error && <div style={{ marginTop: 8, fontSize: 11.5, color: '#A6341D' }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
