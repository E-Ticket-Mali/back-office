import { http } from './http';
import type { OrganizerDashboardStats } from '../types';

export const getOrganizerDashboard = () => http.get<OrganizerDashboardStats>('/organizer/dashboard');
