import { http } from './http';
import type { Hotel, Room, RoomType } from '../types';

export interface HotelInput {
  name: string;
  city: string;
  location: string;
  rating: number;
  desc: string;
}

export interface RoomInput {
  type: RoomType;
  price: number;
  capacity: number;
  /** Nombre de chambres de ce type (obligatoire à la création). */
  quantity: number;
}

export const getHotels = () => http.get<Hotel[]>('/admin/hotels');
export const getHotel = (id: string) => http.get<Hotel>(`/admin/hotels/${id}`);
export const createHotel = (data: HotelInput) => http.post<Hotel>('/admin/hotels', data);
export const updateHotel = (id: string, patch: Partial<HotelInput>) => http.patch<Hotel>(`/admin/hotels/${id}`, patch);
export const deleteHotel = (id: string) => http.delete(`/admin/hotels/${id}`);

export const addRoom = (hotelId: string, data: RoomInput) => http.post<Room>(`/admin/hotels/${hotelId}/rooms`, data);
export const updateRoom = (hotelId: string, roomId: string, patch: Partial<RoomInput>) =>
  http.patch<Room>(`/admin/hotels/${hotelId}/rooms/${roomId}`, patch);
export const deleteRoom = (hotelId: string, roomId: string) => http.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`);
