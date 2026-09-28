import { useState } from 'react';

/** Runs an async user action and keeps its failure message so it can be shown, instead of losing it as an unhandled rejection. */
export function useActionError() {
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const banner = actionError ? (
    <div
      role="alert"
      style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(206,17,38,0.08)', color: '#CE1126', fontSize: 13 }}
    >
      {actionError}
    </div>
  ) : null;

  return { run, banner };
}
