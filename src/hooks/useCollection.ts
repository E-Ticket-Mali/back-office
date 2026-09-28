import { useCallback, useEffect, useRef, useState } from 'react';
import { UnauthorizedError } from '../api/http';

export function useCollection<T>(fetcher: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  // Callers often pass an inline arrow function (new identity on every render). Keeping it in a ref
  // makes `reload` stable, otherwise each fetch -> setState -> re-render -> new fetcher -> fetch again, forever.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => {
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    fetcherRef
      .current()
      .then((rows) => {
        setData(rows);
        hasLoadedOnce.current = true;
      })
      .catch((e: unknown) => {
        // La déconnexion (App -> LoginView) est déjà déclenchée par http.ts : ne pas flasher une erreur ici.
        if (e instanceof UnauthorizedError) return;
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, refreshing, error, reload };
}
