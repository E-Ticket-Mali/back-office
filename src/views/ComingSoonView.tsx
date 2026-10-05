// TODO(Story 6.3 — Écrans organisateur: Mes événements/Billets/Agents/Dashboard): replace each
// stub screen using this component with its real content/API calls.
export function ComingSoonView({ title }: { readonly title: string }) {
  return (
    <div className="bo-page">
      <div
        className="bo-card"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7DED0',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
        }}
      >
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#6B6459' }}>Bientôt disponible.</div>
      </div>
    </div>
  );
}
