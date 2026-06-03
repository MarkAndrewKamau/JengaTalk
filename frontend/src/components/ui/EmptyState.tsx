import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {icon && (
        <div className="w-16 h-16 bg-sand rounded-2xl flex items-center justify-center mb-4 text-concrete">
          {icon}
        </div>
      )}
      <h3 className="font-bold text-lg text-secondary font-display mb-2">{title}</h3>
      {description && <p className="text-concrete text-sm max-w-xs">{description}</p>}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </motion.div>
  )
}
