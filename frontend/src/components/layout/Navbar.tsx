import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, HardHat, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Suppliers', href: '#suppliers' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLanding = location.pathname === '/'

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled || !isLanding
          ? 'bg-secondary/95 backdrop-blur-md shadow-lg shadow-secondary/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              <HardHat size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Jenga<span className="text-primary">Link</span>
            </span>
          </Link>

          {/* Desktop nav */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm" className="shadow-lg">
                Get Started
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-secondary/98 backdrop-blur-md"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {isLanding && navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-white/80 hover:text-white py-2 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-white/10" />
              <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" fullWidth size="md" className="border-white/30 text-white hover:bg-white hover:text-secondary">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register" onClick={() => setMobileOpen(false)}>
                <Button fullWidth size="md">Get Started</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
