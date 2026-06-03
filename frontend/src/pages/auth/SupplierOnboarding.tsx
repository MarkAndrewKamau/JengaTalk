import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Package, Truck, Check, Phone, ArrowRight, ArrowLeft, Plus, X
} from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kiambu', 'Machakos',
  'Nyeri', 'Kakamega', 'Kisii', 'Meru', 'Garissa', 'Embu', 'Malindi', 'Kitale',
  'Kericho', 'Bungoma', 'Kilifi', 'Lamu',
]

const MATERIAL_CATEGORIES = [
  { value: 'cement_aggregates', label: 'Cement & Aggregates' },
  { value: 'steel_iron', label: 'Steel & Iron' },
  { value: 'timber_wood', label: 'Timber & Wood' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'finishing', label: 'Finishing (tiles, paint)' },
]

const DELIVERY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const steps = [
  { label: 'Business Info', icon: Building2 },
  { label: 'Materials', icon: Package },
  { label: 'Delivery', icon: Truck },
  { label: 'Verify', icon: Phone },
]

interface OnboardingData {
  name: string
  phone: string
  business_name: string
  county: string
  town: string
  delivery_radius_km: number
  otp: string
  products: { category: string; name: string; unit: string; price: string; stock: string }[]
  delivery_days: string[]
  min_order_value: string
  delivery_fee_type: string
  payment_methods: string[]
}

export function SupplierOnboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const { setAuth } = useAuthStore()

  const [data, setData] = useState<OnboardingData>({
    name: '', phone: '', business_name: '', county: 'Nairobi', town: '',
    delivery_radius_km: 20, otp: '',
    products: [{ category: 'cement_aggregates', name: '', unit: 'bag', price: '', stock: '' }],
    delivery_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    min_order_value: '5000', delivery_fee_type: 'flat',
    payment_methods: ['cash_on_delivery', 'mobile_money'],
  })

  const update = (key: keyof OnboardingData, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }))

  const addProduct = () =>
    update('products', [...data.products, { category: 'cement_aggregates', name: '', unit: 'bag', price: '', stock: '' }])

  const updateProduct = (i: number, key: string, value: string) => {
    const p = [...data.products]
    p[i] = { ...p[i], [key]: value }
    update('products', p)
  }

  const removeProduct = (i: number) =>
    update('products', data.products.filter((_, idx) => idx !== i))

  const toggleDay = (day: string) => {
    const days = data.delivery_days.includes(day)
      ? data.delivery_days.filter((d) => d !== day)
      : [...data.delivery_days, day]
    update('delivery_days', days)
  }

  const togglePayment = (method: string) => {
    const methods = data.payment_methods.includes(method)
      ? data.payment_methods.filter((m) => m !== method)
      : [...data.payment_methods, method]
    update('payment_methods', methods)
  }

  const handleSendOTP = async () => {
    setLoading(true)
    try {
      await authApi.register({ name: data.name, phone: data.phone, role: 'supplier', county: data.county })
      setOtpSent(true)
      toast.success('OTP sent to your phone')
    } catch {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    const otp = otpDigits.join('')
    setLoading(true)
    try {
      const res = await authApi.verifyOTP({ phone: data.phone, otp })
      setAuth(res.data.user, res.data.token)
      toast.success('Account created! Welcome to JengaLink.')
      navigate('/supplier/overview')
    } catch {
      toast.error('Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otpDigits]
    next[index] = value
    setOtpDigits(next)
    if (value && index < 5) document.getElementById(`sotp-${index + 1}`)?.focus()
  }

  return (
    <AuthLayout title="Supplier Registration" subtitle="List your business and start receiving orders">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-concrete'
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded transition-all ${i < step ? 'bg-success' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 0: Business Info ── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4">
            <Input label="Your Name" placeholder="John Kamau" value={data.name}
              onChange={(e) => update('name', e.target.value)} fullWidth />
            <Input label="Phone Number" type="tel" placeholder="0712 345 678" value={data.phone}
              onChange={(e) => update('phone', e.target.value)} leftIcon={<Phone size={16} />} fullWidth />
            <Input label="Business Name" placeholder="BuildMart Kenya Ltd" value={data.business_name}
              onChange={(e) => update('business_name', e.target.value)} leftIcon={<Building2 size={16} />} fullWidth />
            <Select label="County" value={data.county}
              options={KENYA_COUNTIES.map((c) => ({ value: c, label: c }))}
              onChange={(e) => update('county', e.target.value)} fullWidth />
            <Input label="Town / Area" placeholder="e.g. Westlands" value={data.town}
              onChange={(e) => update('town', e.target.value)} leftIcon={<MapPin size={16} />} fullWidth />
            <div>
              <label className="text-sm font-semibold text-secondary block mb-2">
                Delivery Radius: {data.delivery_radius_km} km
              </label>
              <input type="range" min={5} max={100} step={5} value={data.delivery_radius_km}
                onChange={(e) => update('delivery_radius_km', Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-concrete mt-1"><span>5 km</span><span>100 km</span></div>
            </div>
            <Button onClick={() => setStep(1)} fullWidth size="lg" iconRight={<ArrowRight size={16} />}
              disabled={!data.name || !data.phone || !data.business_name}>
              Next: Materials
            </Button>
          </motion.div>
        )}

        {/* ── Step 1: Materials ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4">
            <p className="text-sm text-concrete">Add the materials you sell. You can add more later from your dashboard.</p>
            {data.products.map((product, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 relative">
                {data.products.length > 1 && (
                  <button onClick={() => removeProduct(i)}
                    className="absolute top-2 right-2 p-1 text-concrete hover:text-danger transition-colors">
                    <X size={14} />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Category" value={product.category} options={MATERIAL_CATEGORIES}
                    onChange={(e) => updateProduct(i, 'category', e.target.value)} fullWidth />
                  <Input label="Material Name" placeholder="OPC Cement" value={product.name}
                    onChange={(e) => updateProduct(i, 'name', e.target.value)} fullWidth />
                  <Select label="Unit" value={product.unit}
                    options={['bag', 'tonne', 'metre', 'sheet', 'piece', 'litre', 'roll'].map((u) => ({ value: u, label: u }))}
                    onChange={(e) => updateProduct(i, 'unit', e.target.value)} fullWidth />
                  <Input label="Price (KES)" type="number" placeholder="720" value={product.price}
                    onChange={(e) => updateProduct(i, 'price', e.target.value)} fullWidth />
                  <Input label="Stock Quantity" type="number" placeholder="500" value={product.stock}
                    onChange={(e) => updateProduct(i, 'stock', e.target.value)} fullWidth className="col-span-2" />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addProduct} icon={<Plus size={16} />} size="sm">
              Add Another Product
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)} icon={<ArrowLeft size={16} />} fullWidth>Back</Button>
              <Button onClick={() => setStep(2)} fullWidth iconRight={<ArrowRight size={16} />}>Next: Delivery</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Delivery Config ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-secondary block mb-2">Delivery Days</label>
              <div className="flex gap-2 flex-wrap">
                {DELIVERY_DAYS.map((day) => (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      data.delivery_days.includes(day)
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-concrete hover:border-primary'
                    }`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Minimum Order Value (KES)" type="number" value={data.min_order_value}
              onChange={(e) => update('min_order_value', e.target.value)} fullWidth />
            <Select label="Delivery Fee Type" value={data.delivery_fee_type}
              options={[
                { value: 'flat', label: 'Flat rate' },
                { value: 'per_km', label: 'Per kilometre' },
                { value: 'free_above', label: 'Free above threshold' },
              ]}
              onChange={(e) => update('delivery_fee_type', e.target.value)} fullWidth />
            <div>
              <label className="text-sm font-semibold text-secondary block mb-2">Payment Methods</label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                  { value: 'mobile_money', label: 'Mobile Money (M-Pesa, Airtel)' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border border-gray-200 hover:border-primary transition-colors">
                    <input type="checkbox" checked={data.payment_methods.includes(value)}
                      onChange={() => togglePayment(value)} className="accent-primary w-4 h-4" />
                    <span className="text-sm text-secondary">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />} fullWidth>Back</Button>
              <Button onClick={() => setStep(3)} fullWidth iconRight={<ArrowRight size={16} />}>Next: Verify</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Phone Verify ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5">
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-sm text-success text-center">
              Almost done! Verify your phone number to go live.
            </div>
            {!otpSent ? (
              <Button onClick={handleSendOTP} loading={loading} fullWidth size="lg" icon={<Phone size={16} />}>
                Send OTP to {data.phone}
              </Button>
            ) : (
              <>
                <div>
                  <label className="text-sm font-semibold text-secondary mb-3 block">Enter 6-digit OTP</label>
                  <div className="flex gap-2">
                    {otpDigits.map((digit, i) => (
                      <input key={i} id={`sotp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && i > 0) document.getElementById(`sotp-${i - 1}`)?.focus() }}
                        className="w-full h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white text-secondary" />
                    ))}
                  </div>
                </div>
                <Button onClick={handleComplete} loading={loading} fullWidth size="lg">
                  Complete Registration
                </Button>
              </>
            )}
            <button onClick={() => setStep(2)} className="text-center text-sm text-concrete hover:text-primary transition-colors">
              ← Back to delivery config
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
