import { cn } from '../../utils/cn'
import type { ReactNode } from 'react'
import type { OrderStatus } from '../../types'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'concrete'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-blue-100 text-blue-700',
  concrete: 'bg-accent/10 text-accent',
}

export function Badge({
  variant = 'default',
  className,
  children,
  dot,
}: {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
  dot?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  )
}

const statusVariants: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'info',
  dispatched: 'primary',
  delivered: 'success',
  cancelled: 'danger',
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={statusVariants[status]} dot>
      {statusLabels[status]}
    </Badge>
  )
}
