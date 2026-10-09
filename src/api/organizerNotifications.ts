import { http } from './http';
import type { OrganizerNotification } from '../types';

export const getOrganizerNotifications = () => http.get<OrganizerNotification[]>('/organizer/notifications');
/** Marque toutes les notifications de l'organisateur comme lues ; renvoie la liste à jour. */
export const markAllOrganizerNotificationsRead = () =>
  http.post<OrganizerNotification[]>('/organizer/notifications/read-all');
