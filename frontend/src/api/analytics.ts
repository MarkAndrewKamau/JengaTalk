import { apiClient } from './client'

// Actual backend response shapes (no ApiResponse wrapper):

// GET /api/analytics/overview  →  { overview: { total_orders_today, revenue_this_week, pending_deliveries, new_enquiries } }
// GET /api/analytics/revenue   →  { revenue: { total, by_status } }
// GET /api/analytics/products  →  { products: [{ id, material, supplier, price, stock_qty, times_queried_week }] }
// GET /api/analytics/sms       →  { sms: { inbound, outbound, by_type } }

export interface BackendOverview {
  total_orders_today: number
  revenue_this_week: number
  pending_deliveries: number
  new_enquiries: number
}

export interface BackendRevenue {
  total: number
  by_status: Record<string, number>
}

export interface BackendProductStat {
  id: string
  material: string
  supplier: string
  price: number
  stock_qty: number
  times_queried_week: number
}

export interface BackendSmsStats {
  inbound: number
  outbound: number
  by_type: Record<string, number>
}

export const analyticsApi = {
  overview: () =>
    apiClient.get<{ overview: BackendOverview }>('/analytics/overview'),

  revenue: () =>
    apiClient.get<{ revenue: BackendRevenue }>('/analytics/revenue'),

  products: () =>
    apiClient.get<{ products: BackendProductStat[] }>('/analytics/products'),

  sms: () =>
    apiClient.get<{ sms: BackendSmsStats }>('/analytics/sms'),
}
