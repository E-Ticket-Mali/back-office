export function filterRows<T extends object>(
  rows: T[],
  fields: (keyof T)[],
  search: string,
  regionFilter: string,
  statusFilter: string
): T[] {
  const s = search.toLowerCase();
  return rows.filter((r) => {
    const rec = r as Record<string, unknown>;
    if (regionFilter && rec.region !== regionFilter) return false;
    if (statusFilter && rec.statut !== statusFilter) return false;
    if (!s) return true;
    return fields.some((f) => String(rec[f as string] ?? '').toLowerCase().includes(s));
  });
}
