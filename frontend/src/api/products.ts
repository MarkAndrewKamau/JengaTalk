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

export interface QuoteRequestPayload {
  quantity?: number
  contractor_phone?: string
  contractor_name?: string
}

export interface QuoteRequestResponse {
  quote: {
    id: string
    supplier_product_id: string
    supplier_id: string
    supplier_code: string
    supplier_name: string
    material_id: string
    material_name: string
    unit: string
    quantity: number
    unit_price: number
    estimated_total: number
    contractor_name: string
    contractor_phone?: string
    status: string
  }
  notification: {
    sent: boolean
    status: string
    error?: string
  }
}

export const productsApi = {
  browse: (params?: { category?: string; q?: string; county?: string; active?: string }) =>
    apiClient.get<{ products: SupplierProduct[] }>('/products', { params }),

  materials: (params?: { q?: string }) =>
    apiClient.get<{ materials: Material[] }>('/products/materials', { params }),

  compare: (params: CompareParams) =>
    apiClient.get<{ material: Material; results: SupplierProduct[] }>('/products/compare', { params }),

  requestQuote: (productId: string, payload?: QuoteRequestPayload) =>
    apiClient.post<QuoteRequestResponse>(`/products/${productId}/quote`, payload || {}),

  add: (payload: Record<string, unknown>) =>
    apiClient.post<{ product: SupplierProduct }>('/products', payload),

  update: (id: string, payload: Partial<SupplierProduct>) =>
    apiClient.put<{ product: SupplierProduct }>(`/products/${id}`, payload),

  remove: (id: string) =>
    apiClient.delete<{ product: SupplierProduct }>(`/products/${id}`),
}
