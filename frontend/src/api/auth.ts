import { apiClient } from './client'
import type { User } from '../types'

export interface RegisterPayload {
  name: string
  phone: string
  role: 'supplier' | 'contractor'
  county: string
}

// Backend returns data directly — no ApiResponse wrapper

export const authApi = {
  // POST /api/auth/register  →  { user, otp_sent, dev_otp? }
  register: (payload: RegisterPayload) =>
    apiClient.post<{ user: User; otp_sent: boolean; dev_otp?: string }>('/auth/register', payload),

  // POST /api/auth/verify-otp  →  { token, user }
  verifyOTP: (payload: { phone: string; otp: string }) =>
    apiClient.post<{ token: string; user: User }>('/auth/verify-otp', payload),

  // POST /api/auth/login  →  { otp_sent, dev_otp? }
  login: (phone: string) =>
    apiClient.post<{ otp_sent: boolean; dev_otp?: string }>('/auth/login', { phone }),

  // POST /api/auth/refresh  →  { token, user }
  refresh: (token: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/refresh', { token }),
}
