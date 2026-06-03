import { apiClient } from './client'
import type { Order, OrderStatus } from '../types'

// POST /api/orders              →  { order: {...} }
// GET  /api/orders              →  { orders: [...] }  (filtered by auth role)
// GET  /api/orders/:id          →  { order: {...} }
// PUT  /api/orders/:id/status   →  { order: {...} }
// POST /api/orders/:id/cancel   →  { order: {...} }

export interface PlaceOrderPayload {
  supplier_id: string
  items: { supplier_product_id: string; quantity: number }[]
  delivery_address: string
  delivery_date?: string
  payment_method: string
  contractor_phone?: string
  contractor_name?: string
  contractor_county?: string
}

export const ordersApi = {
  place: (payload: PlaceOrderPayload) =>
    apiClient.post<{ order: Order }>('/orders', payload),

  list: (params?: { status?: OrderStatus }) =>
    apiClient.get<{ orders: Order[] }>('/orders', { params }),

  get: (id: string) =>
    apiClient.get<{ order: Order }>(`/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    apiClient.put<{ order: Order }>(`/orders/${id}/status`, { status, note }),

  cancel: (id: string, reason?: string) =>
    apiClient.post<{ order: Order }>(`/orders/${id}/cancel`, { reason }),
}
