import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, SupplierProduct } from '../types'

export interface CompareParams {
  material: string
  county?: string
  max_price?: number
  has_delivery?: boolean
  page?: number
  limit?: number
}

export const productsApi = {
  browse: (params?: { category?: string; search?: string; page?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<SupplierProduct>>>('/products', { params }),

  compare: (params: CompareParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<SupplierProduct>>>('/products/compare', { params }),

  add: (payload: Partial<SupplierProduct>) =>
    apiClient.post<ApiResponse<SupplierProduct>>('/products', payload),

  update: (id: string, payload: Partial<SupplierProduct>) =>
    apiClient.put<ApiResponse<SupplierProduct>>(`/products/${id}`, payload),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/products/${id}`),

  bulkUpdatePrice: (ids: string[], type: 'amount' | 'percent', value: number) =>
    apiClient.post<ApiResponse<null>>('/products/bulk-price', { ids, type, value }),
}
