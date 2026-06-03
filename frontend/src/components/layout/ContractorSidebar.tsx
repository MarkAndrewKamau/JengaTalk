import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, ClipboardList, Calculator, Bell, HardHat, LogOut
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { icon: Search, label: 'Compare Prices', href: '/contractor/compare' },
  { icon: ClipboardList, label: 'My Orders', href: '/contractor/orders' },
  { icon: Calculator, label: 'Budget Calculator', href: '/contractor/calculator' },
  { icon: Bell, label: 'Notifications', href: '/contractor/notifications' },
]

export function ContractorSidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <aside className="hidden lg:flex flex-col h-screen w-60 bg-secondary border-r border-white/5 sticky top-0 shrink-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
          <HardHat size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-lg text-white">
          Jenga<span className="text-primary">Link</span>
        </span>
      </div>

      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Contractor Portal</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 relative',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
            >
              {active && (
                <motion.div
                  layoutId="contractor-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
              <item.icon size={18} className="shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-success text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'C'}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Contractor'}</p>
            <p className="text-white/40 text-xs truncate">{user?.county}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
