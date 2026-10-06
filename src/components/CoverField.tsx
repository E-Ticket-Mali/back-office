import { useEffect, useRef, useState } from 'react';
import { getPresetLogos, type PresetLogo } from '../api/presets';
import type { EventCategory } from '../types';
import { defaultPresetFor, type CoverChoice } from '../utils/cover';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

type CoverFieldProps = Readonly<{
  category: EventCategory | string;
  value: CoverChoice;
  onChange: (next: CoverChoice) => void;
}>;

/** Image de couverture obligatoire : présélectionnée sur le logo de la catégorie, remplaçable
 * par un import ou un autre logo. Jamais vide — un événement a toujours une cover. */
export function CoverField({ category, value, onChange }: CoverFieldProps) {
  const [presets, setPresets] = useState<PresetLogo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPresetLogos()
      .then(setPresets)
      .catch(() => setError('Impossible de charger les logos prédéfinis.'));
  }, []);

  // Tant que la cover est le logo automatique, elle suit la catégorie choisie dans le formulaire.
  useEffect(() => {
    if (value.kind === 'preset' && value.auto && value.key !== defaultPresetFor(category)) {
      onChange({ kind: 'preset', key: defaultPresetFor(category), auto: true });
    }
  }, [category, value, onChange]);

  // Libère l'URL d'aperçu d'un fichier remplacé.
  useEffect(() => {
    if (value.kind !== 'file') return undefined;
    const url = value.previewUrl;
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formats acceptés : PNG ou JPEG.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("L'image ne doit pas dépasser 8 Mo.");
      return;
    }
    onChange({ kind: 'file', file, previewUrl: URL.createObjectURL(file) });
  };

  const previewUrl = value.kind === 'file' ? value.previewUrl : presets.find((p) => p.key === value.key)?.url;
  const caption =
    value.kind === 'file'
      ? value.file.name
      : `${presets.find((p) => p.key === value.key)?.label ?? 'Logo'}${value.auto ? ' — logo de la catégorie' : ''}`;

  return (
    <div data-testid="cover-field">
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 6, display: 'block' }}>
        Image de couverture <span style={{ color: '#A6341D' }}>*</span>
      </span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 220,
            aspectRatio: '16 / 9',
            borderRadius: 10,
            border: '1.5px solid #E7DED0',
            background: '#FAF3EB',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Aperçu de la couverture"
              style={{ width: '100%', height: '100%', objectFit: value.kind === 'file' ? 'cover' : 'contain', padding: value.kind === 'file' ? 0 : 14 }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, color: '#6B6459', marginBottom: 8 }} data-testid="cover-caption">
            {caption}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            aria-label="Importer une image de couverture"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid #164A23',
              background: 'transparent',
              color: '#164A23',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            Importer une image (PNG/JPEG, 8 Mo max)
          </button>
          <div style={{ fontSize: 11.5, color: '#6B6459', marginBottom: 6 }}>Ou un logo prédéfini :</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map((p) => {
              const selected = value.kind === 'preset' && value.key === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  title={p.label}
                  aria-label={`Logo ${p.label}`}
                  aria-pressed={selected}
                  onClick={() => onChange({ kind: 'preset', key: p.key, auto: p.key === defaultPresetFor(category) })}
                  style={{
                    width: 40,
                    height: 40,
                    padding: 4,
                    borderRadius: 8,
                    border: selected ? '2px solid #164A23' : '1px solid #E7DED0',
                    background: '#FAF3EB',
                    cursor: 'pointer',
                  }}
                >
                  <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              );
            })}
          </div>
          {error && <div style={{ marginTop: 8, fontSize: 11.5, color: '#A6341D' }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
