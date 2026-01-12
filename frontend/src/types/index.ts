export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  roomId: number;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  reason: string | null;
  createdAt: string;
  updatedAt?: string;
  room?: Room;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateReservationRequest {
  roomId: number;
  startAt: string;
  endAt: string;
  reason?: string;
}

