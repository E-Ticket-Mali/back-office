import { useEffect, useRef, useState } from 'react';
import { UnauthorizedError } from '../api/http';
import type { PageResponse } from '../types';

/** Délai avant d'interroger le serveur après la dernière frappe dans le champ de recherche. */
const SEARCH_DEBOUNCE_MS = 300;
/** Longueur minimale d'une recherche texte : en dessous, elle n'est pas envoyée (le serveur la refuserait). */
export const MIN_SEARCH_LENGTH = 3;

interface PagedParams<F> {
  /** Page affichée, à partir de 1. */
  page: number;
  size: number;
  search: string;
  /** Autres filtres, transmis tels quels au chargeur. */
  filters: F;
}

type Loader<T, F> = (args: { page: number; size: number; q?: string; filters: F }) => Promise<PageResponse<T>>;

/**
 * Liste paginée côté serveur : une page à la fois, recherche différée, réponses obsolètes ignorées.
 *
 * Une réponse lente à une ancienne requête ne doit jamais écraser la plus récente (référentiel § 8.3) : chaque
 * chargement porte un numéro, et seul le dernier est appliqué.
 */
export function usePagedList<T, F>(loader: Loader<T, F>, { page, size, search, filters }: PagedParams<F>) {
  const [items, setItems] = useState<T[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounced, setDebounced] = useState(search);
  const latest = useRef(0);
  const loaded = useRef(false);
  // Le chargeur est souvent une fonction écrite à la volée : on le garde en référence pour ne pas relancer le
  // chargement à chaque rendu.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const text = debounced.trim();
  const q = text.length >= MIN_SEARCH_LENGTH ? text : undefined;
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    const id = ++latest.current;
    if (loaded.current) setRefreshing(true);
    else setLoading(true);
    setError(null);
    loaderRef
      .current({ page: page - 1, size, q, filters: JSON.parse(filtersKey) as F })
      .then((res) => {
        if (id !== latest.current) return;
        setItems(res.items);
        setHasNext(res.hasNext);
        loaded.current = true;
      })
      .catch((e: unknown) => {
        // La déconnexion est déjà gérée par http.ts : pas d'erreur affichée en plus.
        if (id !== latest.current || e instanceof UnauthorizedError) return;
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      })
      .finally(() => {
        if (id !== latest.current) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, [page, size, q, filtersKey]);

  return { items, hasNext, loading, refreshing, error };
}
