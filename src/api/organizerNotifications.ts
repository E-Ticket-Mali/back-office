import { http } from './http';
import type { OrganizerNotification } from '../types';

export const getOrganizerNotifications = () => http.get<OrganizerNotification[]>('/organizer/notifications');
