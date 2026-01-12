import { apiClient } from './axios';
import { User, UserRole } from '../types';

export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export const usersApi = {
  getAll: async (page: number = 1, limit: number = 20, search?: string): Promise<PaginatedUsersResponse> => {
    const params: { page: number; limit: number; search?: string } = { page, limit };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<PaginatedUsersResponse>('/users', {
      params,
    });
    return response.data;
  },

  updateRole: async (id: string, role: UserRole): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
