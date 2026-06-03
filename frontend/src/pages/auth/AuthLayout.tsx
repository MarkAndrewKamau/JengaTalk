import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HardHat } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  side?: 'dark' | 'orange'
}

export function AuthLayout({ title, subtitle, children, side = 'dark' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className={`hidden lg:flex flex-col w-5/12 p-12 ${side === 'orange' ? 'bg-primary' : 'bg-secondary'} construction-bg`}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <HardHat size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">
            Jenga<span className={side === 'orange' ? 'text-secondary' : 'text-primary'}>Link</span>
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
              Fair prices.<br />Fast deliveries.<br />Built for builders.
            </h2>
            <p className="text-white/60 leading-relaxed">
              Join thousands of contractors and suppliers on Kenya's construction materials marketplace.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { value: '847+', label: 'Suppliers' },
                { value: '28', label: 'Counties' },
                { value: '12K+', label: 'Orders' },
                { value: '4.8★', label: 'Rating' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="font-display font-bold text-2xl text-white">{value}</div>
                  <div className="text-white/50 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">SMS Shortcode</p>
          <p className="text-white font-mono font-bold">PRICE cement nairobi → 20880</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-sand overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center">
              <HardHat size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-secondary">
              Jenga<span className="text-primary">Link</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-secondary mb-2">{title}</h1>
            {subtitle && <p className="text-concrete">{subtitle}</p>}
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  )
}
