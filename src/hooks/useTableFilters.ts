import { useState, useCallback } from 'react';

export function useTableFilters() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const onRegionFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionFilter(e.target.value);
    setPage(1);
  };
  const onStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const reset = useCallback(() => {
    setSearch('');
    setRegionFilter('');
    setStatusFilter('');
    setPage(1);
  }, []);

  return {
    search,
    regionFilter,
    statusFilter,
    page,
    setPage,
    onSearch,
    onRegionFilter,
    onStatusFilter,
    reset,
  };
}

export type TableFilters = ReturnType<typeof useTableFilters>;
