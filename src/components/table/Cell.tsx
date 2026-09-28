import type { Cell as CellType } from './types';
import { CategoryIcon, Icon } from '../Icon';

export function CellView(props: Readonly<{ cell: CellType }>) {
  const { cell } = props;
  if (cell.kind === 'plain') {
    return (
      <div
        style={{
          minWidth: 0,
          color: '#1F2E35',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          lineHeight: 1.35,
        }}
      >
        {cell.text}
      </div>
    );
  }

  if (cell.kind === 'rating') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1F2E35' }}>
        <Icon name="star" size={14} color="#D9A800" filled />
        {cell.value.toFixed(1)}
      </div>
    );
  }

  if (cell.kind === 'eventName') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, color: '#1F2E35' }}>
        <CategoryIcon category={cell.category} size={16} color="#164A23" />
        <span style={{ overflowWrap: 'anywhere' }}>{cell.text}</span>
      </div>
    );
  }

  if (cell.kind === 'badge') {
    return (
      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span
          style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            color: cell.color,
            background: cell.bg,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            textAlign: 'center',
            lineHeight: 1.2,
            display: 'inline-block',
            maxWidth: '100%',
          }}
        >
          {cell.text}
        </span>
      </div>
    );
  }

  if (cell.kind === 'rowActions') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <button type="button" onClick={cell.onEdit} title="Modifier" style={actionBtnStyle('#164A23')}>
          Modifier
        </button>
        <button type="button" onClick={cell.onDelete} title="Supprimer" style={actionBtnStyle('#A6341D')}>
          Supprimer
        </button>
      </div>
    );
  }

  if (cell.kind === 'entityActions') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <button type="button" onClick={cell.onEdit} title="Modifier" style={actionBtnStyle('#164A23')}>
          Modifier
        </button>
        <button type="button" onClick={cell.onDetail} title="Détails" style={actionBtnStyle('#6B6459')}>
          Détails
        </button>
        <button type="button" onClick={cell.onDelete} title="Supprimer" style={actionBtnStyle('#A6341D')}>
          Supprimer
        </button>
      </div>
    );
  }

  if (cell.kind === 'editDetailActions') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <button type="button" onClick={cell.onEdit} title="Modifier" style={actionBtnStyle('#164A23')}>
          Modifier
        </button>
        <button type="button" onClick={cell.onDetail} title="Détails" style={actionBtnStyle('#6B6459')}>
          Détails
        </button>
      </div>
    );
  }

  if (cell.kind === 'detailOnlyActions') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <button type="button" onClick={cell.onDetail} title="Détails" style={actionBtnStyle('#6B6459')}>
          Détails
        </button>
      </div>
    );
  }

  return null;
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    padding: '5px 8px',
    border: `1px solid ${color}`,
    background: 'transparent',
    color,
    borderRadius: 5,
    fontSize: 10.5,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
