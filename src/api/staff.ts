import { http } from './http';
import type { StaffAgent } from '../types';

export interface StaffInput {
  staffCode: string;
  agentName: string;
}

export const getStaff = () => http.get<StaffAgent[]>('/admin/staff');
export const getStaffMember = (id: string) => http.get<StaffAgent>(`/admin/staff/${id}`);
export const createStaff = (data: StaffInput) => http.post<StaffAgent>('/admin/staff', data);
export const updateStaff = (id: string, patch: { agentName: string }) => http.patch<StaffAgent>(`/admin/staff/${id}`, patch);
export const deleteStaff = (id: string) => http.delete(`/admin/staff/${id}`);
