import { http } from './http';
import type { AdminPayoutRequest, PayoutStatus } from '../types';

export const getAdminPayoutRequests = (status?: PayoutStatus) =>
  http.get<AdminPayoutRequest[]>(`/admin/payout-requests${status ? `?status=${status}` : ''}`);
export const approvePayoutRequest = (id: string) => http.post<AdminPayoutRequest>(`/admin/payout-requests/${id}/approve`);
export const rejectPayoutRequest = (id: string, reason: string) =>
  http.post<AdminPayoutRequest>(`/admin/payout-requests/${id}/reject`, { reason });
export const markPayoutPaid = (id: string) => http.post<AdminPayoutRequest>(`/admin/payout-requests/${id}/mark-paid`);
