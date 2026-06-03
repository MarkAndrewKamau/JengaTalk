import { apiClient } from './client'
import type { Material, SupplierProduct } from '../types'

// GET /api/products             →  { products: [...] }
// GET /api/products/materials   →  { materials: [...] }
// GET /api/products/compare     →  { material: {...}, results: [...] }
// POST /api/products            →  { product: {...} }
// PUT /api/products/:id         →  { product: {...} }
// DELETE /api/products/:id      →  { product: {...} } (soft delete — sets is_active=false)

export interface CompareParams {
  material?: string
  q?: string
  county?: string
  limit?: number
}

export const productsApi = {
  browse: (params?: { category?: string; q?: string; county?: string; active?: string }) =>
    apiClient.get<{ products: SupplierProduct[] }>('/products', { params }),

  materials: (params?: { q?: string }) =>
    apiClient.get<{ materials: Material[] }>('/products/materials', { params }),

  compare: (params: CompareParams) =>
    apiClient.get<{ material: Material; results: SupplierProduct[] }>('/products/compare', { params }),

  add: (payload: Record<string, unknown>) =>
    apiClient.post<{ product: SupplierProduct }>('/products', payload),

  update: (id: string, payload: Partial<SupplierProduct>) =>
    apiClient.put<{ product: SupplierProduct }>(`/products/${id}`, payload),

  remove: (id: string) =>
    apiClient.delete<{ product: SupplierProduct }>(`/products/${id}`),
}
