import type { EventCategory } from '../../types';

export interface Column {
  label: string;
  /** Grid track: a number (px) or a raw CSS track string like 'minmax(110px,1fr)'. */
  width: number | string;
}

export interface PlainCell {
  kind: 'plain';
  text: string | number;
}

export interface BadgeCell {
  kind: 'badge';
  text: string;
  color: string;
  bg: string;
}

export interface RowActionsCell {
  kind: 'rowActions';
  onEdit: () => void;
  onDelete: () => void;
}

export interface EntityActionsCell {
  kind: 'entityActions';
  /** Absent = pas d'action « Modifier » (ex. événement d'organisateur, modéré mais non modifiable). */
  onEdit?: () => void;
  onDetail: () => void;
  onDelete: () => void;
}

export interface EditDetailActionsCell {
  kind: 'editDetailActions';
  onEdit: () => void;
  onDetail: () => void;
  extra?: RowExtraAction;
}

/** Action métier supplémentaire d'une ligne (ex. « Publier »), affichée en premier. */
export interface RowExtraAction {
  label: string;
  onClick: () => void;
  /** Mise en avant (bouton plein) plutôt que contour. */
  primary?: boolean;
}

export interface DetailOnlyActionsCell {
  kind: 'detailOnlyActions';
  onDetail: () => void;
  extra?: RowExtraAction;
  /** Libellé du bouton (« Détails » par défaut ; ex. « Gérer », « Consulter »). */
  detailLabel?: string;
}

export interface RatingCell {
  kind: 'rating';
  value: number;
}

export interface EventNameCell {
  kind: 'eventName';
  category: EventCategory;
  text: string;
}

export type Cell =
  | PlainCell
  | RatingCell
  | EventNameCell
  | BadgeCell
  | RowActionsCell
  | EntityActionsCell
  | EditDetailActionsCell
  | DetailOnlyActionsCell;

export interface Row {
  key: string;
  cells: Cell[];
}

export function trackWidth(w: number | string): string {
  return typeof w === 'number' ? `${w}px` : w;
}

export function gridTemplateFor(columns: Column[]): string {
  return columns.map((c) => trackWidth(c.width)).join(' ');
}

export function plain(text: string | number): PlainCell {
  return { kind: 'plain', text };
}

export function badge(text: string, color: string, bg: string): BadgeCell {
  return { kind: 'badge', text, color, bg };
}

export function rowActions(onEdit: () => void, onDelete: () => void): RowActionsCell {
  return { kind: 'rowActions', onEdit, onDelete };
}

export function entityActions(onEdit: (() => void) | undefined, onDetail: () => void, onDelete: () => void): EntityActionsCell {
  return { kind: 'entityActions', onEdit, onDetail, onDelete };
}

export function editDetailActions(onEdit: () => void, onDetail: () => void, extra?: RowExtraAction): EditDetailActionsCell {
  return { kind: 'editDetailActions', onEdit, onDetail, extra };
}

export function detailOnlyActions(onDetail: () => void, extra?: RowExtraAction, detailLabel?: string): DetailOnlyActionsCell {
  return { kind: 'detailOnlyActions', onDetail, extra, detailLabel };
}

export function rating(value: number): RatingCell {
  return { kind: 'rating', value };
}

export function eventName(category: EventCategory, text: string): EventNameCell {
  return { kind: 'eventName', category, text };
}
