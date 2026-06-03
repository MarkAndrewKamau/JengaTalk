import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, HardHat, ArrowRight, CheckCircle } from 'lucide-react'
import { AuthLayout } from './AuthLayout'

const roles = [
  {
    key: 'supplier',
    icon: Building2,
    title: 'I\'m a Supplier',
    subtitle: 'Hardware store, material distributor, or manufacturer',
    benefits: [
      'Reach more contractors across Kenya',
      'Manage inventory & orders from one dashboard',
      'Send delivery alerts via SMS automatically',
      'Weekly payouts via Mobile Money',
    ],
    color: 'border-primary bg-primary/5 hover:bg-primary/10',
    iconBg: 'bg-primary/10 text-primary',
    href: '/auth/register/supplier',
    badge: 'Grow Your Business',
    badgeColor: 'bg-primary/10 text-primary',
  },
  {
    key: 'contractor',
    icon: HardHat,
    title: 'I\'m a Contractor',
    subtitle: 'Fundi, site manager, or construction company',
    benefits: [
      'Compare prices from verified suppliers instantly',
      'Order via SMS — no smartphone required',
      'Track deliveries in real-time',
      'Set price alerts for materials you need',
    ],
    color: 'border-success bg-success/5 hover:bg-success/10',
    iconBg: 'bg-success/10 text-success',
    href: '/auth/register/contractor',
    badge: 'Save on Materials',
    badgeColor: 'bg-success/10 text-success',
  },
]

export function RegisterSelectPage() {
  return (
    <AuthLayout title="Join JengaLink" subtitle="Choose how you'll use the platform">
      <div className="flex flex-col gap-4">
        {roles.map((role, i) => (
          <motion.div
            key={role.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          >
            <Link to={role.href}>
              <div className={`rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 group ${role.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.iconBg}`}>
                    <role.icon size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role.badgeColor}`}>
                      {role.badge}
                    </span>
                    <ArrowRight size={16} className="text-concrete group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-secondary mb-1">{role.title}</h3>
                <p className="text-concrete text-sm mb-4">{role.subtitle}</p>
                <ul className="flex flex-col gap-1.5">
                  {role.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-secondary/70">
                      <CheckCircle size={13} className="text-success shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </motion.div>
        ))}

        <p className="text-center text-sm text-concrete mt-2">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
