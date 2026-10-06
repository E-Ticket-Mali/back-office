import { useEffect, useRef, useState } from 'react';
import { getPresetLogos, type PresetLogo } from '../api/presets';

interface ImagePickerProps {
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onSelectPreset: (presetKey: string) => Promise<void>;
  onClear: () => Promise<void>;
  /** Square side in px — the same component is used for a large event cover and a small
   * ticket-type thumbnail. */
  size?: number;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

export function ImagePicker(props: Readonly<ImagePickerProps>) {
  const { imageUrl, onUpload, onSelectPreset, onClear, size = 120 } = props;
  const [presets, setPresets] = useState<PresetLogo[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pickerOpen && presets.length === 0) {
      getPresetLogos()
        .then(setPresets)
        .catch(() => setError("Impossible de charger les logos prédéfinis."));
    }
  }, [pickerOpen, presets.length]);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
      setPickerOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formats acceptés : PNG ou JPEG.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("L'image ne doit pas dépasser 8 Mo.");
      return;
    }
    // Server-side still resizes anything too large — this is just a fast client-side reject for
    // obviously wrong files before spending an upload round-trip.
    run(() => onUpload(file));
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          border: '1.5px dashed #E7DED0',
          background: '#FAF3EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: busy ? 'not-allowed' : 'pointer',
          position: 'relative',
        }}
        onClick={() => !busy && setPickerOpen((v) => !v)}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 11, color: '#6B6459', textAlign: 'center', padding: 8 }}>Ajouter une image</span>
        )}
      </div>

      {pickerOpen && (
        <div
          style={{
            marginTop: 10,
            padding: 14,
            border: '1px solid #E7DED0',
            borderRadius: 10,
            background: '#FFFFFF',
            width: 280,
            boxShadow: '0 6px 20px rgba(31,46,53,0.12)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #164A23',
              background: 'transparent',
              color: '#164A23',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              marginBottom: 10,
            }}
          >
            Importer depuis cet ordinateur (PNG/JPEG, 8 Mo max)
          </button>

          <div style={{ fontSize: 11.5, color: '#6B6459', marginBottom: 8 }}>Ou choisir un logo prédéfini :</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                title={p.label}
                disabled={busy}
                onClick={() => run(() => onSelectPreset(p.key))}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  padding: 0,
                  border: '1px solid #E7DED0',
                  borderRadius: 8,
                  background: '#FAF3EB',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  overflow: 'hidden',
                }}
              >
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
              </button>
            ))}
          </div>

          {imageUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(onClear)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #A6341D',
                background: 'transparent',
                color: '#A6341D',
                fontSize: 12,
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              Retirer l'image
            </button>
          )}

          {error && <div style={{ marginTop: 8, fontSize: 11.5, color: '#A6341D' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
