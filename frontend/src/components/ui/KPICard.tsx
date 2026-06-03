import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState, type ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon: ReactNode
  iconBg?: string
  prefix?: string
  suffix?: string
  index?: number
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(ease * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, value])

  return <span ref={ref}>{display.toLocaleString()}</span>
}

export function KPICard({ title, value, change, icon, iconBg = 'bg-primary/10', prefix = '', suffix = '', index = 0 }: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''))
  const isNumeric = !isNaN(numericValue)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            change > 0 ? 'bg-success/10 text-success' : change < 0 ? 'bg-danger/10 text-danger' : 'bg-gray-100 text-concrete',
          )}>
            {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-sm text-concrete font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold font-display text-secondary">
        {prefix}
        {isNumeric ? <AnimatedNumber value={numericValue} /> : value}
        {suffix}
      </p>
      {change !== undefined && (
        <p className="text-xs text-concrete mt-1">vs last period</p>
      )}
    </motion.div>
  )
}
