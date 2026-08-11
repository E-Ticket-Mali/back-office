import { useState } from 'react';

export type FieldType = 'text' | 'number' | 'tel' | 'select' | 'checkbox' | 'datetime-local';

export type FormValues = Record<string, string | number | boolean>;

/** A select option: a bare string is both the stored value and the displayed label; use the object form when they differ (e.g. an id vs a human-readable name). */
export type SelectOption = string | { value: string; label: string };

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly SelectOption[] | ((values: FormValues) => readonly SelectOption[]);
  /** Force le champ à occuper toute la largeur du formulaire dans une grille 2 colonnes. */
  fullWidth?: boolean;
  /** Le champ n'est pas rendu du tout tant que cette fonction renvoie false. */
  visible?: (values: FormValues) => boolean;
  /** Clés remises à '' quand la valeur de ce champ change (ex: changer de région invalide le département choisi). */
  resets?: string[];
}

interface EntityFormProps {
  fields: FieldDef[];
  initialValues: object;
  submitLabel: string;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  /** Nombre de colonnes de la grille. Par défaut 2 si le formulaire compte plus de 4 champs, sinon 1. */
  columns?: 1 | 2;
}

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

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B6459',
  marginBottom: 6,
  display: 'block',
};

type SetField = (field: FieldDef, value: string | number | boolean) => void;

function renderField(field: FieldDef, values: FormValues, setField: SetField, colCount: number) {
  const rawOptions = typeof field.options === 'function' ? field.options(values) : field.options ?? [];
  const options = rawOptions.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));

  return (
    <div key={field.key} style={field.fullWidth ? { gridColumn: `span ${colCount}` } : undefined}>
      <label style={labelStyle} htmlFor={`field-${field.key}`}>
        {field.label}
      </label>
      {renderControl(field, values, setField, options)}
    </div>
  );
}

type SelectOptionItem = { value: string; label: string };

function renderControl(field: FieldDef, values: FormValues, setField: SetField, options: readonly SelectOptionItem[]) {
  if (field.type === 'select') {
    return (
      <select
        id={`field-${field.key}`}
        style={{ ...inputStyle, cursor: 'pointer' }}
        value={String(values[field.key] ?? '')}
        onChange={(e) => setField(field, e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
        <input
          id={`field-${field.key}`}
          type="checkbox"
          checked={Boolean(values[field.key])}
          onChange={(e) => setField(field, e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer' }}
        />
      </div>
    );
  }

  if (field.type === 'datetime-local') {
    return (
      <input
        id={`field-${field.key}`}
        style={inputStyle}
        type="datetime-local"
        value={String(values[field.key] ?? '')}
        onChange={(e) => setField(field, e.target.value)}
      />
    );
  }

  if (field.type === 'tel') {
    return (
      <input
        id={`field-${field.key}`}
        style={inputStyle}
        type="tel"
        inputMode="numeric"
        pattern="[0-9 +]*"
        placeholder="77 000 00 00"
        value={String(values[field.key] ?? '')}
        onChange={(e) => setField(field, e.target.value)}
      />
    );
  }

  return (
    <input
      id={`field-${field.key}`}
      style={inputStyle}
      type={field.type === 'number' ? 'number' : 'text'}
      value={String(values[field.key] ?? '')}
      onChange={(e) => setField(field, field.type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  );
}

export function EntityForm(props: Readonly<EntityFormProps>) {
  const { fields, initialValues, submitLabel, onSubmit, onCancel, columns } = props;
  const [values, setValues] = useState<FormValues>(initialValues as FormValues);
  const visibleFields = fields.filter((f) => !f.visible || f.visible(values));
  const colCount = columns ?? (visibleFields.length > 4 ? 2 : 1);

  const setField = (f: FieldDef, value: string | number | boolean) =>
    setValues((v) => {
      const next: FormValues = { ...v, [f.key]: value };
      for (const key of f.resets ?? []) next[key] = '';
      return next;
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div
        className="bo-form-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          columnGap: 16,
          rowGap: 16,
          marginBottom: 22,
        }}
      >
        {visibleFields.map((field) => renderField(field, values, setField, colCount))}
      </div>
      <div className="bo-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 18, borderTop: '1px solid #E7DED0' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 18px',
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
          type="submit"
          style={{
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
    </form>
  );
}
