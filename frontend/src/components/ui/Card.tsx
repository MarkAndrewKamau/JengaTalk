import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils/cn'
import type { ReactNode } from 'react'

interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'dark' | 'orange' | 'glass'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const cardVariants = {
  default: 'bg-white border border-gray-100 shadow-sm',
  dark: 'bg-secondary text-white border border-white/10',
  orange: 'bg-primary text-white border border-primary-dark',
  glass: 'bg-white/70 backdrop-blur-sm border border-white/50 shadow-sm',
}

export function Card({ hover = false, padding = 'md', variant = 'default', className, children, ...props }: CardProps & { children?: ReactNode }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'rounded-2xl overflow-hidden',
        paddings[padding],
        cardVariants[variant],
        hover && 'cursor-pointer transition-shadow hover:shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h3 className={cn('text-lg font-bold font-display text-secondary', className)}>
      {children}
    </h3>
  )
}
