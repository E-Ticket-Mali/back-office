export function LoadingState({ label = 'Chargement des données…' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '64px 0',
        color: '#6B6459',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '3px solid #E7DED0',
          borderTopColor: '#164A23',
          animation: 'erp-spin 0.7s linear infinite',
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      <style>{'@keyframes erp-spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '20px 22px',
        borderRadius: 10,
        border: '1px solid #F5DCD4',
        background: '#FBEDE8',
        color: '#8A2E17',
        fontSize: 13.5,
        fontWeight: 600,
      }}
    >
      Erreur : {message}
    </div>
  );
}

export function InlineRefreshHint() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 14,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px',
        borderRadius: 999,
        background: '#164A23',
        color: '#FAF3EB',
        fontSize: 11.5,
        fontWeight: 600,
        boxShadow: '0 6px 18px rgba(31,46,53,0.25)',
        zIndex: 50,
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid rgba(250,243,235,0.35)',
          borderTopColor: '#FAF3EB',
          animation: 'erp-spin 0.7s linear infinite',
        }}
      />
      Synchronisation…
      <style>{'@keyframes erp-spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
