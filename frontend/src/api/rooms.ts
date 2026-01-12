import { apiClient } from './axios';
import { Room } from '../types';

export interface PaginatedRoomsResponse {
  data: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateRoomRequest {
  name: string;
  capacity: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoomRequest {
  name?: string;
  capacity?: number;
  description?: string;
  isActive?: boolean;
}

export const roomsApi = {
  getAll: async (): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>('/rooms');
    return response.data;
  },

  getAllAdmin: async (page: number = 1, limit: number = 20): Promise<PaginatedRoomsResponse> => {
    const response = await apiClient.get<PaginatedRoomsResponse>('/rooms/admin', {
      params: { page, limit },
    });
    return response.data;
  },

  create: async (data: CreateRoomRequest): Promise<Room> => {
    const response = await apiClient.post<Room>('/rooms', data);
    return response.data;
  },

  update: async (id: number, data: UpdateRoomRequest): Promise<Room> => {
    const response = await apiClient.patch<Room>(`/rooms/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};

