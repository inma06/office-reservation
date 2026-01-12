import { apiClient } from './axios';
import { Reservation, CreateReservationRequest, ReservationStatus } from '../types';

export interface UpdateReservationStatusRequest {
  status: ReservationStatus.CONFIRMED | ReservationStatus.REJECTED;
  reason?: string;
}

export const reservationsApi = {
  getAll: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>('/reservations');
    return response.data;
  },

  create: async (data: CreateReservationRequest): Promise<Reservation> => {
    const response = await apiClient.post<Reservation>('/reservations', data);
    return response.data;
  },

  cancel: async (id: string): Promise<Reservation> => {
    const response = await apiClient.patch<Reservation>(`/reservations/${id}/cancel`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    data: UpdateReservationStatusRequest,
  ): Promise<Reservation> => {
    const response = await apiClient.patch<Reservation>(
      `/reservations/${id}/status`,
      data,
    );
    return response.data;
  },
};

