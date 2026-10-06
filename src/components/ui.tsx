// Composants visuels partagés ; styles et helpers dans ./uiStyles.
import { cardStyle } from './uiStyles';

export function StatusBadge(props: Readonly<{ label: string; color: string; bg: string }>) {
  const { label, color, bg } = props;
  return (
    <span
      style={{
        fontFamily: "'Poppins',sans-serif",
        fontSize: 11.5,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 999,
        color,
        background: bg,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export interface TabDef<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/** Onglets horizontaux — reprennent les sous-entrées de la sidebar à l'intérieur d'une page. */
export function Tabs<T extends string>(props: Readonly<{ tabs: TabDef<T>[]; active: T; onChange: (id: T) => void }>) {
  const { tabs, active, onChange } = props;
  return (
    <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            style={{
              border: `1px solid ${selected ? '#164A23' : '#E7DED0'}`,
              background: selected ? '#164A23' : '#FFFFFF',
              color: selected ? '#FAF3EB' : '#1F2E35',
              borderRadius: 999,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {tab.label}
            {tab.count !== undefined && <span style={{ marginLeft: 6, opacity: 0.7 }}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export interface HeadlineItem {
  label: string;
  /** Rend l'élément cliquable (raccourci vers la page qui permet d'agir). */
  onClick?: () => void;
  highlight?: boolean;
}

/** Bandeau de synthèse en tête de tableau de bord : « 24 événements en ligne · 8 organisateurs en attente · … ». */
export function HeadlineBar(props: Readonly<{ items: HeadlineItem[] }>) {
  const { items } = props;
  return (
    <div
      className="bo-card"
      style={{
        ...cardStyle,
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        fontFamily: "'Poppins',sans-serif",
        fontSize: 14,
      }}
    >
      {items.map((item, i) => (
        <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span style={{ color: '#C9BFAF' }}>·</span>}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 600,
                color: item.highlight ? '#A6741D' : '#164A23',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{ fontWeight: 600, color: '#164A23' }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
