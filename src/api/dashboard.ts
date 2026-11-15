import { http } from './http';
import type { DashboardStats } from '../types';

export const getDashboardStats = () => http.get<DashboardStats>('/admin/dashboard/stats');

/** Éléments à traiter (badges du menu, encart du tableau de bord), comptés en SQL en un seul appel. */
export interface Attention {
  eventsToReview: number;
  publishedEvents: number;
  organizersPending: number;
  payoutsPending: number;
}

export const getAttention = () => http.get<Attention>('/admin/dashboard/attention');
