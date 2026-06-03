import { Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../stores/authStore'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { user } = useAuthStore()

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20"
    >
      <div>
        <h1 className="font-display font-bold text-xl text-secondary">{title}</h1>
        {subtitle && <p className="text-sm text-concrete mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl text-concrete hover:text-secondary hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm font-bold">{user?.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-secondary leading-none">{user?.name}</p>
            <p className="text-xs text-concrete mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
