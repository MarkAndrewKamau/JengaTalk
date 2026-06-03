// ─── User & Auth ───────────────────────────────────────────────
export type UserRole = 'supplier' | 'contractor' | 'admin'

export interface User {
  id: string
  phone: string
  name: string
  role: UserRole
  county: string
  verified: boolean
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

// ─── Supplier ──────────────────────────────────────────────────
export interface Supplier {
  id: string
  user_id: string
  business_name: string
  registration_no?: string
  location_lat?: number
  location_lng?: number
  county: string
  town: string
  delivery_radius_km: number
  delivery_days: string[]
  min_order_value: number
  delivery_fee_type: 'flat' | 'per_km' | 'free_above'
  delivery_fee?: number
  free_above_amount?: number
  payment_methods: string[]
  rating: number
  total_orders: number
  is_active: boolean
  created_at: string
}

// ─── Materials & Products ──────────────────────────────────────
export type MaterialCategory =
  | 'cement_aggregates'
  | 'steel_iron'
  | 'timber_wood'
  | 'roofing'
  | 'plumbing'
  | 'electrical'
  | 'finishing'

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  cement_aggregates: 'Cement & Aggregates',
  steel_iron: 'Steel & Iron',
  timber_wood: 'Timber & Wood',
  roofing: 'Roofing',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  finishing: 'Finishing',
}

export type MaterialUnit = 'bag' | 'tonne' | 'metre' | 'sheet' | 'piece' | 'litre' | 'roll'

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  unit: MaterialUnit
  description?: string
  image_url?: string
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  material_id: string
  material?: Material
  supplier?: Supplier
  price: number
  stock_qty: number
  min_order_qty: number
  is_active: boolean
  updated_at: string
  times_queried_week?: number
}

// ─── Orders ────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'cash_on_delivery' | 'mobile_money' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface OrderItem {
  id: string
  order_id: string
  supplier_product_id: string
  product?: SupplierProduct
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: string
  contractor_id: string
  contractor?: User
  supplier_id: string
  supplier?: Supplier
  items: OrderItem[]
  total_amount: number
  status: OrderStatus
  delivery_address: string
  delivery_date?: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
}

// ─── SMS ───────────────────────────────────────────────────────
export type SMSDirection = 'in' | 'out'
export type SMSType = 'enquiry' | 'order' | 'alert' | 'otp' | 'broadcast'

export interface SMSLog {
  id: string
  from_phone: string
  to_phone: string
  message: string
  direction: SMSDirection
  message_type: SMSType
  at_message_id?: string
  cost?: number
  status: string
  created_at: string
}

// ─── Price Alerts ──────────────────────────────────────────────
export interface PriceAlert {
  id: string
  contractor_id: string
  material_id: string
  material?: Material
  target_price: number
  county: string
  is_active: boolean
  triggered_at?: string
  created_at: string
}

// ─── Analytics ─────────────────────────────────────────────────
export interface OverviewKPIs {
  orders_today: number
  revenue_this_week: number
  pending_deliveries: number
  new_enquiries: number
  orders_today_change: number
  revenue_change: number
  deliveries_change: number
  enquiries_change: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface ProductPerformance {
  product_name: string
  category: MaterialCategory
  queries: number
  orders: number
  revenue: number
}

// ─── Delivery Events ───────────────────────────────────────────
export type DeliveryEventType =
  | 'order_placed'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'failed'

export interface DeliveryEvent {
  id: string
  order_id: string
  order?: Order
  event_type: DeliveryEventType
  note?: string
  sms_sent: boolean
  created_at: string
}

// ─── Pagination ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// ─── API Response ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}
