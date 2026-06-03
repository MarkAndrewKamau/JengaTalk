import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingCart, Truck, Star, CheckCircle, MessageSquare,
  ArrowRight, MapPin, Phone, Building2, HardHat, ChevronDown,
  Zap, Shield, TrendingDown, Users
} from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { Button } from '../../components/ui/Button'
import { suppliersApi } from '../../api/suppliers'
import { productsApi } from '../../api/products'

// ─── SMS Chat Animation ────────────────────────────────────────────────────────
const smsConversation = [
  { from: 'user', text: 'PRICE cement nairobi', delay: 0 },
  { from: 'bot', text: 'JengaLink Prices — OPC Cement (Nairobi)\n1. BuildMart: KES 720/bag ✓ Delivery\n2. ProHardware: KES 735/bag ✓ Delivery\n3. NaiHardware: KES 760/bag\nReply: ORDER 1 [qty]', delay: 1.5 },
  { from: 'user', text: 'ORDER 1 50', delay: 4 },
  { from: 'bot', text: '✅ Order #1042 confirmed!\n50 bags × KES 720 = KES 36,000\nDelivery: Tomorrow 8am\nDriver will call before arrival', delay: 5.5 },
]

function SMSBubble({ msg }: { msg: typeof smsConversation[0] }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), msg.delay * 1000 + 800)
    return () => clearTimeout(t)
  }, [msg.delay])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
            msg.from === 'user'
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-white/15 text-white rounded-bl-sm border border-white/10'
          }`}>
            {msg.text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Stats Counter ─────────────────────────────────────────────────────────────
function CounterStat({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Don't animate until we have real data
    if (!inView || end === 0) return
    const duration = 2000
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(ease * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, end])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-display font-bold text-white mb-1 min-h-[44px] flex items-center justify-center">
        {end === 0 ? (
          // Loading skeleton
          <span className="inline-block w-16 h-8 bg-white/20 rounded-lg animate-pulse" />
        ) : (
          <>{count.toLocaleString()}{suffix}</>
        )}
      </div>
      <div className="text-white/60 text-sm">{label}</div>
    </div>
  )
}

// ─── How It Works Step ────────────────────────────────────────────────────────
const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Compare',
    description: 'Send "PRICE cement nairobi" to 20880. Get instant prices from verified suppliers near you.',
    color: 'bg-primary',
  },
  {
    step: '02',
    icon: ShoppingCart,
    title: 'Order',
    description: 'Reply with the supplier code to confirm your order. No smartphone needed.',
    color: 'bg-success',
  },
  {
    step: '03',
    icon: Truck,
    title: 'Track',
    description: 'Get SMS updates every step of the way — from packing to delivery.',
    color: 'bg-secondary',
  },
]

// ─── Featured Suppliers ───────────────────────────────────────────────────────
const featuredSuppliers = [
  { name: 'BuildMart Kenya', county: 'Nairobi', rating: 4.8, orders: 1240, badge: 'Top Supplier' },
  { name: 'ProHardware Ltd', county: 'Mombasa', rating: 4.7, orders: 890, badge: 'Verified' },
  { name: 'NaiHardware', county: 'Nairobi', rating: 4.6, orders: 760, badge: 'Fast Delivery' },
  { name: 'Coast Builders', county: 'Mombasa', rating: 4.9, orders: 1100, badge: 'Best Price' },
  { name: 'Upcountry Supplies', county: 'Nakuru', rating: 4.5, orders: 430, badge: 'Verified' },
  { name: 'Thika Steel & More', county: 'Kiambu', rating: 4.7, orders: 650, badge: 'Fast Delivery' },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'James Kariuki',
    role: 'Site Contractor, Nairobi',
    text: 'Before JengaLink I was calling 5 hardware shops just to compare cement prices. Now I send one SMS and have 3 quotes in seconds.',
    avatar: 'JK',
    rating: 5,
  },
  {
    name: 'Mary Wanjiku',
    role: 'Hardware Supplier, Mombasa',
    text: 'My orders doubled in the first month. Contractors trust that my prices are real because they\'re verified on the platform.',
    avatar: 'MW',
    rating: 5,
  },
  {
    name: 'Peter Otieno',
    role: 'Site Supervisor, Kisumu',
    text: 'The SMS alerts mean my workers are never standing around waiting for deliveries. We know exactly when materials arrive.',
    avatar: 'PO',
    rating: 5,
  },
]

// ─── Main Landing Page ────────────────────────────────────────────────────────
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const [smsKey, setSmsKey] = useState(0)

  // Replay SMS animation every 10s
  useEffect(() => {
    const t = setInterval(() => setSmsKey((k) => k + 1), 12000)
    return () => clearInterval(t)
  }, [])

  // Live platform stats from public API endpoints
  const { data: suppliersData } = useQuery({
    queryKey: ['landing-suppliers'],
    queryFn: () => suppliersApi.list(),
    staleTime: 5 * 60_000,
  })
  const { data: materialsData } = useQuery({
    queryKey: ['landing-materials'],
    queryFn: () => productsApi.materials(),
    staleTime: 5 * 60_000,
  })

  const suppliers = suppliersData?.data?.suppliers ?? []
  const supplierCount = suppliers.length
  const ordersTotal = suppliers.reduce((sum: number, s: { total_orders?: number }) => sum + (s.total_orders || 0), 0)
  const materialCount = materialsData?.data?.materials?.length ?? 0
  const countyCount = new Set(suppliers.map((s: { county: string }) => s.county)).size

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden construction-bg">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-success/8 rounded-full blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/80" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Text content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-bold tracking-wide uppercase mb-6">
                  <Zap size={12} />
                  Powered by Africa's Talking
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                className="font-display font-bold text-white leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
              >
                Stop Overpaying{' '}
                <span className="relative">
                  <span className="text-primary">for Cement.</span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/40 rounded-full origin-left"
                  />
                </span>
                <br />Compare. Order. Build.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg"
              >
                Works on <strong className="text-white">any phone</strong>. No internet needed — just SMS.
                Compare prices from verified suppliers, place orders, and track deliveries — all from your feature phone.
              </motion.p>

              {/* Shortcode callout */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse-glow shrink-0">
                    <MessageSquare size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-0.5">Send SMS to get started</p>
                    <p className="text-white font-mono font-bold text-lg tracking-widest">
                      PRICE cement nairobi → <span className="text-primary">20880</span>
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link to="/auth/register?role=supplier">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Building2 size={18} />
                    Register as Supplier
                  </Button>
                </Link>
                <Link to="/auth/register?role=contractor">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white hover:text-secondary">
                    <HardHat size={18} />
                    I'm a Contractor
                  </Button>
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-6 mt-8"
              >
                {[
                  { icon: Shield, text: 'Verified Suppliers' },
                  { icon: CheckCircle, text: 'Price Guaranteed' },
                  { icon: Star, text: '4.8★ Rated' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-white/50 text-xs">
                    <Icon size={13} className="text-primary" />
                    {text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — SMS demo phone */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative animate-float">
                {/* Phone frame */}
                <div className="w-72 bg-secondary/80 rounded-[2.5rem] p-3 border border-white/15 shadow-2xl shadow-black/50 backdrop-blur-sm">
                  {/* Phone notch */}
                  <div className="flex items-center justify-between px-4 py-2 mb-2">
                    <span className="text-white/50 text-xs">9:41</span>
                    <div className="w-16 h-4 bg-secondary rounded-full" />
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-2 w-1 rounded-sm bg-white/${i === 3 ? 70 : i * 20 + 20}`} />
                      ))}
                    </div>
                  </div>

                  {/* SMS header */}
                  <div className="bg-primary/20 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2.5 border border-primary/30">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                      <MessageSquare size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">JengaLink</p>
                      <p className="text-white/50 text-xs">20880 • Active</p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-success rounded-full animate-pulse" />
                  </div>

                  {/* Chat messages */}
                  <div key={smsKey} className="flex flex-col gap-2.5 min-h-56 px-1">
                    {smsConversation.map((msg, i) => (
                      <SMSBubble key={`${smsKey}-${i}`} msg={msg} />
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="mt-3 bg-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-white/30 text-xs flex-1">Type a message…</span>
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <ArrowRight size={11} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-6 bg-success text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-success/30"
                >
                  ✅ Order Confirmed
                </motion.div>
                <motion.div
                  animate={{ y: [4, -4, 4] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -bottom-4 -left-6 bg-white text-secondary text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg"
                >
                  💰 Saved KES 2,000
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-white/30 text-xs">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown size={16} className="text-white/40" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <section className="bg-primary py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <CounterStat end={supplierCount} suffix="" label="Suppliers Onboarded" />
            <CounterStat end={ordersTotal} suffix="" label="Orders Processed" />
            <CounterStat end={materialCount} suffix="" label="Materials Listed" />
            <CounterStat end={countyCount} suffix="" label="Counties Covered" />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-sand">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Simple as SMS</span>
            <h2 className="font-display font-bold text-4xl text-secondary mt-3 mb-4">
              How JengaLink Works
            </h2>
            <p className="text-concrete max-w-xl mx-auto">
              Three steps. Any phone. No data needed. Built for contractors on the ground.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-0.5 bg-gradient-to-r from-primary via-success to-secondary" />

            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                    <step.icon size={28} className="text-white" />
                  </div>
                  <div className="text-xs text-primary font-bold mb-2 tracking-widest">{step.step}</div>
                  <h3 className="font-display font-bold text-xl text-secondary mb-3">{step.title}</h3>
                  <p className="text-concrete text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* SMS commands reference */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-secondary rounded-2xl p-8"
          >
            <h3 className="font-display font-bold text-white text-center mb-6">
              SMS Commands — Send to <span className="text-primary">20880</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { cmd: 'PRICE cement nairobi', desc: 'Compare prices' },
                { cmd: 'ORDER BM01 50', desc: 'Place order' },
                { cmd: 'STATUS 1042', desc: 'Track order' },
                { cmd: 'ALERT cement 700', desc: 'Price alert' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                  <code className="text-primary font-mono text-sm block mb-1">{cmd}</code>
                  <span className="text-white/50 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Suppliers ────────────────────────────────────── */}
      <section id="suppliers" className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Trusted Network</span>
            <h2 className="font-display font-bold text-4xl text-secondary mt-3 mb-4">
              Top-Rated Suppliers
            </h2>
            <p className="text-concrete max-w-lg mx-auto">
              All suppliers are verified and rated by contractors. Prices are updated daily.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredSuppliers.map((supplier, i) => (
              <motion.div
                key={supplier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-sand rounded-2xl p-5 border border-gray-100 cursor-pointer group transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 size={22} className="text-primary" />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    supplier.badge === 'Top Supplier' ? 'bg-primary/10 text-primary' :
                    supplier.badge === 'Best Price' ? 'bg-success/10 text-success' :
                    'bg-gray-100 text-concrete'
                  }`}>
                    {supplier.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-secondary mb-1">{supplier.name}</h3>
                <div className="flex items-center gap-1 text-concrete text-xs mb-3">
                  <MapPin size={12} />
                  {supplier.county}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-warning">
                    {'★'.repeat(5)}
                    <span className="text-secondary font-bold ml-1">{supplier.rating}</span>
                  </div>
                  <span className="text-concrete text-xs">{supplier.orders.toLocaleString()} orders</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features / Value Props ────────────────────────────────── */}
      <section className="py-24 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary text-sm font-bold uppercase tracking-widest">Why JengaLink</span>
              <h2 className="font-display font-bold text-4xl text-white mt-3 mb-6 leading-tight">
                Fair prices.<br />Fast deliveries.<br />Built for builders.
              </h2>
              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: TrendingDown,
                    title: 'Save up to 18% on materials',
                    desc: 'Price transparency means suppliers compete. You win.',
                    color: 'text-success',
                  },
                  {
                    icon: MessageSquare,
                    title: 'Works on any phone',
                    desc: 'SMS and USSD mean no smartphone or internet required.',
                    color: 'text-primary',
                  },
                  {
                    icon: Shield,
                    title: 'Verified suppliers only',
                    desc: 'Every supplier is manually reviewed before going live.',
                    color: 'text-blue-400',
                  },
                  {
                    icon: Users,
                    title: 'Community rated',
                    desc: 'Real reviews from real contractors across Kenya.',
                    color: 'text-warning',
                  },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Icon size={18} className={color} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-0.5">{title}</h4>
                      <p className="text-white/50 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* USSD preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="w-72 bg-black rounded-[2.5rem] p-4 border border-white/10 shadow-2xl">
                <div className="bg-gray-900 rounded-[2rem] p-5 font-mono text-green-400 text-xs leading-relaxed">
                  <div className="text-center text-green-300 font-bold mb-3 border-b border-green-900 pb-3">
                    *384*880#
                  </div>
                  <div className="mb-3 text-green-300">Welcome to JengaLink</div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      '1. Compare Prices',
                      '2. Track My Order',
                      '3. My Orders',
                      '4. Set Price Alert',
                      '5. Contact Support',
                    ].map((item) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-green-500"
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-green-900 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-300">›</span>
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="text-green-400"
                      >1_</motion.span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-sand">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Real Stories</span>
            <h2 className="font-display font-bold text-4xl text-secondary mt-3 mb-4">
              Builders Trust JengaLink
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex text-warning text-sm mb-4">{'★'.repeat(t.rating)}</div>
                <p className="text-secondary text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-secondary text-sm">{t.name}</p>
                    <p className="text-concrete text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-4xl text-white mb-4">
              Start saving on materials today
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Join 800+ suppliers and 5,000+ contractors already on JengaLink.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register?role=supplier">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-secondary hover:bg-secondary-light">
                  <Building2 size={18} />
                  List Your Supplies
                </Button>
              </Link>
              <Link to="/auth/register?role=contractor">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  <HardHat size={18} />
                  Find Best Prices
                </Button>
              </Link>
            </div>
            <p className="text-white/60 text-sm mt-6 flex items-center justify-center gap-2">
              <Phone size={14} />
              Or SMS <strong className="text-white">HELP</strong> to <strong className="text-white">20880</strong>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-secondary border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <HardHat size={15} className="text-white" />
                </div>
                <span className="font-display font-bold text-white text-lg">JengaLink</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Fair prices. Fast deliveries. Built for builders across Africa.
              </p>
              <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/50 text-xs mb-1">SMS Shortcode</p>
                <p className="text-primary font-mono font-bold">20880</p>
              </div>
            </div>
            {[
              { title: 'Product', links: ['How It Works', 'Pricing', 'Suppliers', 'USSD Guide'] },
              { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Supplier Terms'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-semibold mb-4">{title}</h4>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2025 JengaLink. Built for Africa's builders.</p>
            <p className="text-white/20 text-xs flex items-center gap-2">
              Powered by
              <span className="text-white/40 font-semibold">Africa's Talking</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
