import { http } from './http';
import type { DashboardStats } from '../types';

export const getDashboardStats = () => http.get<DashboardStats>('/admin/dashboard/stats');
