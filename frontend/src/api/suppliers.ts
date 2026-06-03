import { apiClient } from './client'
import type { Supplier, SupplierProduct } from '../types'

// GET /api/suppliers            →  { suppliers: [...] }
// GET /api/suppliers/:id        →  { supplier: {...} }
// POST /api/suppliers           →  { supplier: {...} }
// PUT /api/suppliers/:id        →  { supplier: {...} }
// GET /api/suppliers/:id/products → { supplier: {...}, products: [...] }

export const suppliersApi = {
  list: (params?: { county?: string; q?: string }) =>
    apiClient.get<{ suppliers: Supplier[] }>('/suppliers', { params }),

  get: (id: string) =>
    apiClient.get<{ supplier: Supplier }>(`/suppliers/${id}`),

  create: (payload: Partial<Supplier>) =>
    apiClient.post<{ supplier: Supplier }>('/suppliers', payload),

  update: (id: string, payload: Partial<Supplier>) =>
    apiClient.put<{ supplier: Supplier }>(`/suppliers/${id}`, payload),

  getProducts: (id: string) =>
    apiClient.get<{ supplier: Supplier; products: SupplierProduct[] }>(`/suppliers/${id}/products`),
}
