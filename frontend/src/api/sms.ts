import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, SMSLog } from '../types'

export const smsApi = {
  inbox: (params?: { page?: number; type?: string }) =>
    apiClient.get<ApiResponse<PaginatedResponse<SMSLog>>>('/sms/inbox', { params }),

  send: (to: string, message: string) =>
    apiClient.post<ApiResponse<{ message_id: string }>>('/sms/send', { to, message }),

  broadcast: (message: string, scheduled_at?: string) =>
    apiClient.post<ApiResponse<{ sent: number }>>('/sms/broadcast', { message, scheduled_at }),

  autoReplyConfig: (config: Record<string, unknown>) =>
    apiClient.put<ApiResponse<null>>('/sms/auto-reply', config),
}
