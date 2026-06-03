import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, ClipboardList, Truck, BarChart3,
  MessageSquare, Settings, HardHat, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/supplier/overview' },
  { icon: Package, label: 'My Products', href: '/supplier/products' },
  { icon: ClipboardList, label: 'Orders', href: '/supplier/orders' },
  { icon: Truck, label: 'Deliveries', href: '/supplier/deliveries' },
  { icon: BarChart3, label: 'Analytics', href: '/supplier/analytics' },
  { icon: MessageSquare, label: 'SMS Center', href: '/supplier/sms-center' },
  { icon: Settings, label: 'Settings', href: '/supplier/settings' },
]

export function SupplierSidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="hidden lg:flex flex-col h-screen bg-secondary border-r border-white/5 sticky top-0 shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <HardHat size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display font-bold text-lg text-white whitespace-nowrap overflow-hidden"
            >
              Jenga<span className="text-primary">Link</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 group relative',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
              <item.icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-light text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 p-3">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', !collapsed && 'mb-2')}>
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'S'}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white text-sm font-semibold truncate">{user?.name || 'Supplier'}</p>
                <p className="text-white/40 text-xs truncate">{user?.phone}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm',
          )}
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-secondary border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors shadow-md z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
