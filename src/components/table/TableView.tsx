import type { ChangeEvent, ReactNode } from 'react';
import type { Column, Row } from './types';
import { gridTemplateFor } from './types';
import { CellView } from './Cell';
import { Icon } from '../Icon';

interface TableViewProps {
  columns: Column[];
  rows: Row[];
  totalRows: number;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  regionOptions?: readonly string[];
  statusOptions?: readonly string[];
  regionFilter?: string;
  statusFilter?: string;
  onRegionFilter?: (e: ChangeEvent<HTMLSelectElement>) => void;
  onStatusFilter?: (e: ChangeEvent<HTMLSelectElement>) => void;
  onCreate?: () => void;
  /** Libellé du bouton de création — par défaut « + Nouveau ». */
  createLabel?: string;
  /** Contenu additionnel affiché juste avant le bouton "+ Nouveau" (ex: bascule de vue). */
  headerExtra?: ReactNode;
}

const selectStyle: React.CSSProperties = {
  padding: '9px 14px',
  border: '1.5px solid #E7DED0',
  borderRadius: 8,
  fontSize: 13,
  background: '#FFFFFF',
  color: '#1F2E35',
};

export function TableView({
  columns,
  rows,
  totalRows,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  regionOptions,
  statusOptions,
  regionFilter,
  statusFilter,
  onRegionFilter,
  onStatusFilter,
  onCreate,
  createLabel = '+ Nouveau',
  headerExtra,
}: Readonly<TableViewProps>) {
  const gridCols = gridTemplateFor(columns);

  return (
    <div>
      <div className="bo-table-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="bo-table-toolbar-group" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {regionOptions && (
            <select value={regionFilter} onChange={onRegionFilter} style={selectStyle}>
              <option value="">Toutes les régions</option>
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
          {statusOptions && (
            <select value={statusFilter} onChange={onStatusFilter} style={selectStyle}>
              <option value="">Tous les statuts</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="bo-table-toolbar-count" style={{ fontSize: 12.5, color: '#6B6459' }}>{totalRows} résultats</div>
        <div className="bo-table-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {headerExtra}
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              style={{
                background: '#164A23',
                color: '#FAF3EB',
                border: 'none',
                padding: '11px 20px',
                borderRadius: 8,
                fontFamily: "'Poppins',sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {createLabel}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7DED0',
          borderRadius: 10,
          overflowX: 'auto',
          overflowY: 'hidden',
          boxShadow: '0 2px 8px rgba(31,46,53,0.06)',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: 8,
            background: '#DCE7DD',
            color: '#0F3419',
            fontFamily: "'Poppins',sans-serif",
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          {columns.map((c) => (
            <div key={c.label} style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.label}
            </div>
          ))}
        </div>
        {rows.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#6B6459' }}>Aucun résultat.</div>
        )}
        {rows.map((row, i) => (
          <div
            key={row.key}
            data-testid="table-row"
            className="erp-table-row"
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              gap: 8,
              alignItems: 'center',
              borderTop: '1px solid #E7DED0',
              padding: '11px 16px',
              fontSize: 13,
              background: i % 2 === 1 ? '#FBF8F2' : '#FFFFFF',
              transition: 'background 0.12s',
            }}
          >
            {row.cells.map((cell) => (
              <CellView key={`${row.key}-${cell.kind}-${'text' in cell ? String(cell.text) : 'actions'}`} cell={cell} />
            ))}
          </div>
        ))}
      </div>
      <style>{'.erp-table-row:hover { background: #F0E9DA !important; }'}</style>

      <div className="bo-table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{ fontSize: 12.5, color: '#6B6459' }}>
          Page {page} / {totalPages}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onPrevPage} style={pagerBtn}>
            <Icon name="back" size={14} /> Précédent
          </button>
          <button type="button" onClick={onNextPage} style={pagerBtn}>
            Suivant <Icon name="next" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const pagerBtn: React.CSSProperties = {
  padding: '8px 16px',
  border: '1.5px solid #164A23',
  background: 'transparent',
  color: '#164A23',
  borderRadius: 8,
  fontFamily: "'Poppins',sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
