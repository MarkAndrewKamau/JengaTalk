import { apiClient } from './client'
import type { ApiResponse, OverviewKPIs, RevenueDataPoint, ProductPerformance } from '../types'

export const analyticsApi = {
  overview: () =>
    apiClient.get<ApiResponse<OverviewKPIs>>('/analytics/overview'),

  revenue: (params?: { period?: 'week' | 'month' | 'custom'; from?: string; to?: string }) =>
    apiClient.get<ApiResponse<RevenueDataPoint[]>>('/analytics/revenue', { params }),

  products: () =>
    apiClient.get<ApiResponse<ProductPerformance[]>>('/analytics/products'),

  sms: (params?: { period?: string }) =>
    apiClient.get<ApiResponse<{ enquiries: number; orders: number; rate: number }>>('/analytics/sms', { params }),
}
