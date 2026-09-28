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
  onEdit: () => void;
  onDetail: () => void;
  onDelete: () => void;
}

export interface EditDetailActionsCell {
  kind: 'editDetailActions';
  onEdit: () => void;
  onDetail: () => void;
}

export interface DetailOnlyActionsCell {
  kind: 'detailOnlyActions';
  onDetail: () => void;
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

export function entityActions(onEdit: () => void, onDetail: () => void, onDelete: () => void): EntityActionsCell {
  return { kind: 'entityActions', onEdit, onDetail, onDelete };
}

export function editDetailActions(onEdit: () => void, onDetail: () => void): EditDetailActionsCell {
  return { kind: 'editDetailActions', onEdit, onDetail };
}

export function detailOnlyActions(onDetail: () => void): DetailOnlyActionsCell {
  return { kind: 'detailOnlyActions', onDetail };
}

export function rating(value: number): RatingCell {
  return { kind: 'rating', value };
}

export function eventName(category: EventCategory, text: string): EventNameCell {
  return { kind: 'eventName', category, text };
}
