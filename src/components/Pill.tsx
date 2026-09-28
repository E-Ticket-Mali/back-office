import type { TicketType } from '../types';

const PILL_STYLES = {
  FREE: { bg: '#14B53A', color: '#FFFFFF' },
  VIP: { bg: 'rgba(252,209,22,0.28)', color: '#8A6A00' },
  STANDARD: { bg: 'rgba(44,44,42,0.08)', color: '#5F5E5A' },
  EARLY_BIRD: { bg: 'rgba(46,109,185,0.12)', color: '#2E6DB9' },
} as const;

const TYPE_LABELS: Record<TicketType, string> = { VIP: 'VIP', STANDARD: 'Standard', EARLY_BIRD: 'Early Bird' };

/** Small coloured pill ("Gratuit", "VIP", ...) used in event and ticket lists. */
export function Pill(props: Readonly<{ label: string; bg: string; color: string }>) {
  const { label, bg, color } = props;
  return (
    <span
      style={{
        fontFamily: "'Poppins',sans-serif",
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 9px',
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

export function TicketTypePill(props: Readonly<{ type: TicketType }>) {
  const style = PILL_STYLES[props.type];
  return <Pill label={TYPE_LABELS[props.type]} bg={style.bg} color={style.color} />;
}

export function FreePill() {
  return <Pill label="Gratuit" bg={PILL_STYLES.FREE.bg} color={PILL_STYLES.FREE.color} />;
}
