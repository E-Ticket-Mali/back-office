interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}

export function KpiCard(props: Readonly<KpiCardProps>) {
  const { label, value, sub, color } = props;
  return (
    <div
      className="bo-card bo-kpi-card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E7DED0',
        borderRadius: 10,
        padding: 18,
        boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
      }}
    >
      <div style={{ fontSize: 12, color: '#6B6459', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6B6459' }}>{sub}</div>
      </div>
    </div>
  );
}
