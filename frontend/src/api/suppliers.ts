import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, Supplier, SupplierProduct } from '../types'

export const suppliersApi = {
  list: (params?: { county?: string; search?: string; page?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Supplier>>>('/suppliers', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`),

  create: (payload: Partial<Supplier>) =>
    apiClient.post<ApiResponse<Supplier>>('/suppliers', payload),

  update: (id: string, payload: Partial<Supplier>) =>
    apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, payload),

  getProducts: (id: string) =>
    apiClient.get<ApiResponse<SupplierProduct[]>>(`/suppliers/${id}/products`),
}
