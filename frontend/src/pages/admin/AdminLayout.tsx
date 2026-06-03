import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Building2, BarChart3, DollarSign,
  LogOut, Shield
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin/overview' },
  { icon: Building2, label: 'Suppliers', href: '/admin/suppliers' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: DollarSign, label: 'Price Monitor', href: '/admin/pricing' },
]

export function AdminLayout() {
  const location = useLocation()
  const { logout } = useAuthStore()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden lg:flex flex-col h-screen w-60 bg-secondary border-r border-white/5 sticky top-0 shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">Admin Panel</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.href)
            return (
              <Link key={item.href} to={item.href}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 relative',
                  active ? 'bg-primary/15 text-primary' : 'text-white/60 hover:text-white hover:bg-white/5',
                )}>
                {active && <motion.div layoutId="admin-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                <item.icon size={18} className="shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm">
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
