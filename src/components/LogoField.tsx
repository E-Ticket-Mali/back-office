import { useEffect, useRef, useState } from 'react';
import { getPresetLogos, type PresetLogo } from '../api/presets';
import type { EventCategory } from '../types';
import { defaultPresetFor, type LogoChoice } from '../utils/logo';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

type LogoFieldProps = Readonly<{
  category: EventCategory | string;
  /** `null` = conserver le visuel actuel (modification d'un événement existant). */
  value: LogoChoice | null;
  onChange: (next: LogoChoice) => void;
  /** Visuel actuellement enregistré, affiché tant que `value` est null. */
  currentUrl?: string | null;
}>;

/** Visuel de l'événement (carré 1:1) : identifie l'événement dans les listes et cartes de l'application.
 * Présélectionné sur le visuel de la catégorie, remplaçable par un import ou un autre visuel prédéfini. */
export function LogoField({ category, value, onChange, currentUrl }: LogoFieldProps) {
  const [presets, setPresets] = useState<PresetLogo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPresetLogos()
      .then(setPresets)
      .catch(() => setError('Impossible de charger les visuels prédéfinis.'));
  }, []);

  // Tant que le visuel est celui de la catégorie (automatique), il suit la catégorie choisie.
  useEffect(() => {
    if (value && value.kind === 'preset' && value.auto && value.key !== defaultPresetFor(category)) {
      onChange({ kind: 'preset', key: defaultPresetFor(category), auto: true });
    }
  }, [category, value, onChange]);

  // Libère l'URL d'aperçu d'un fichier remplacé.
  useEffect(() => {
    if (!value || value.kind !== 'file') return undefined;
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

  let previewUrl: string | null | undefined = currentUrl;
  let caption = 'Visuel actuel — choisissez-en un autre pour le remplacer';
  if (value?.kind === 'file') {
    previewUrl = value.previewUrl;
    caption = value.file.name;
  } else if (value?.kind === 'preset') {
    const preset = presets.find((p) => p.key === value.key);
    previewUrl = preset?.url;
    caption = `${preset?.label ?? 'Visuel'}${value.auto ? ' — visuel de la catégorie' : ''}`;
  }

  return (
    <div data-testid="logo-field">
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6459', marginBottom: 2, display: 'block' }}>
        Visuel de l&apos;événement <span style={{ color: '#A6341D' }}>*</span>
      </span>
      <span style={{ fontSize: 11.5, color: '#6B6459', marginBottom: 8, display: 'block' }}>
        Image carrée utilisée dans les listes, cartes et résultats de recherche de l&apos;application.
      </span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 120,
            aspectRatio: '1 / 1',
            borderRadius: 12,
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
              alt="Aperçu du visuel"
              style={{
                width: '100%',
                height: '100%',
                objectFit: value?.kind === 'file' || !value ? 'cover' : 'contain',
                padding: value?.kind === 'preset' ? 14 : 0,
              }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, color: '#6B6459', marginBottom: 8 }} data-testid="logo-caption">
            {caption}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            aria-label="Importer un visuel"
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
          <div style={{ fontSize: 11.5, color: '#6B6459', marginBottom: 6 }}>Ou un visuel prédéfini :</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map((p) => {
              const selected = value?.kind === 'preset' && value.key === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  title={p.label}
                  aria-label={`Visuel ${p.label}`}
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
