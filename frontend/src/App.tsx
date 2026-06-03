import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './stores/authStore'

// Landing
import { LandingPage } from './pages/landing/LandingPage'

// Auth
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterSelectPage } from './pages/auth/RegisterSelectPage'
import { SupplierOnboarding } from './pages/auth/SupplierOnboarding'
import { ContractorRegisterPage } from './pages/auth/ContractorRegisterPage'

// Supplier
import { SupplierLayout } from './pages/supplier/SupplierLayout'
import { OverviewPage } from './pages/supplier/OverviewPage'
import { ProductsPage } from './pages/supplier/ProductsPage'
import { OrdersPage } from './pages/supplier/OrdersPage'
import { DeliveriesPage } from './pages/supplier/DeliveriesPage'
import { AnalyticsPage } from './pages/supplier/AnalyticsPage'
import { SMSCenterPage } from './pages/supplier/SMSCenterPage'
import { SettingsPage } from './pages/supplier/SettingsPage'

// Contractor
import { ContractorLayout } from './pages/contractor/ContractorLayout'
import { ComparePage } from './pages/contractor/ComparePage'
import { ContractorOrdersPage } from './pages/contractor/OrdersPage'
import { CalculatorPage } from './pages/contractor/CalculatorPage'
import { NotificationsPage } from './pages/contractor/NotificationsPage'

// Admin
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterSelectPage />} />
        <Route path="/auth/register/supplier" element={<SupplierOnboarding />} />
        <Route path="/auth/register/contractor" element={<ContractorRegisterPage />} />

        {/* Supplier Dashboard */}
        <Route path="/supplier" element={
          <ProtectedRoute role="supplier"><SupplierLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/supplier/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="sms-center" element={<SMSCenterPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Contractor Portal */}
        <Route path="/contractor" element={
          <ProtectedRoute role="contractor"><ContractorLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/contractor/compare" replace />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="orders" element={<ContractorOrdersPage />} />
          <Route path="calculator" element={<CalculatorPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverviewPage />} />
          <Route path="suppliers" element={<AdminOverviewPage />} />
          <Route path="analytics" element={<AdminOverviewPage />} />
          <Route path="pricing" element={<AdminOverviewPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
