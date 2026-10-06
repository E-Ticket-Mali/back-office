import { http } from './http';
import type { Balance, PayoutRequest } from '../types';

export const getBalance = () => http.get<Balance>('/organizer/finance/balance');
export const getPayoutRequests = () => http.get<PayoutRequest[]>('/organizer/finance/payout-requests');
export const createPayoutRequest = (amount: number) =>
  http.post<PayoutRequest>('/organizer/finance/payout-requests', { amount });
