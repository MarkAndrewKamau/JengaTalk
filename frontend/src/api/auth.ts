import { apiClient } from './client'
import type { ApiResponse, User } from '../types'

export interface RegisterPayload {
  name: string
  phone: string
  role: 'supplier' | 'contractor'
  county: string
}

export interface OTPPayload {
  phone: string
  otp: string
}

export interface LoginPayload {
  phone: string
  otp: string
}

export interface AuthTokenResponse {
  user: User
  token: string
  refresh_token: string
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/register', payload),

  verifyOTP: (payload: OTPPayload) =>
    apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/verify-otp', payload),

  login: (phone: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/login', { phone }),

  refresh: (refresh_token: string) =>
    apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh', { refresh_token }),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
}
