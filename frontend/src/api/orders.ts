import { apiClient } from './client'
import type { ApiResponse, Order, OrderStatus, PaginatedResponse } from '../types'

export interface PlaceOrderPayload {
  supplier_id: string
  items: { supplier_product_id: string; quantity: number }[]
  delivery_address: string
  delivery_date?: string
  payment_method: string
}

export const ordersApi = {
  place: (payload: PlaceOrderPayload) =>
    apiClient.post<ApiResponse<Order>>('/orders', payload),

  list: (params?: { status?: OrderStatus; page?: number; role?: 'supplier' | 'contractor' }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    apiClient.put<ApiResponse<Order>>(`/orders/${id}/status`, { status, note }),

  cancel: (id: string, reason?: string) =>
    apiClient.post<ApiResponse<null>>(`/orders/${id}/cancel`, { reason }),

  sendSMS: (id: string, message: string, template?: string) =>
    apiClient.post<ApiResponse<null>>(`/orders/${id}/sms`, { message, template }),
}
