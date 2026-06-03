import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, HardHat, Shield } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kiambu',
  'Machakos', 'Nyeri', 'Kakamega', 'Kisii', 'Meru', 'Garissa', 'Embu',
]

const CONTRACTOR_TYPES = [
  { value: 'individual', label: 'Individual Fundi' },
  { value: 'small_company', label: 'Small Company' },
  { value: 'site_manager', label: 'Site Manager' },
]

export function ContractorRegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [loading, setLoading] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [form, setForm] = useState({ name: '', phone: '', county: 'Nairobi', type: 'individual' })

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSendOTP = async () => {
    if (!form.name || !form.phone) return
    setLoading(true)
    try {
      await authApi.register({ name: form.name, phone: form.phone, role: 'contractor', county: form.county })
      setStep('otp')
      toast.success('OTP sent to your phone')
    } catch {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    const otp = otpDigits.join('')
    if (otp.length < 6) return
    setLoading(true)
    try {
      const res = await authApi.verifyOTP({ phone: form.phone, otp })
      const { user, token } = res.data
      setAuth(user, token)
      toast.success(`Welcome to JengaLink, ${user.name}!`)
      navigate('/contractor/compare')
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
    if (value && index < 5) document.getElementById(`cotp-${index + 1}`)?.focus()
  }

  return (
    <AuthLayout title="Contractor Registration" subtitle="Start comparing prices in minutes" side="orange">
      <AnimatePresence mode="wait">
        {step === 'info' ? (
          <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4">
            <Input label="Your Name" placeholder="James Kariuki" value={form.name}
              onChange={(e) => update('name', e.target.value)} leftIcon={<HardHat size={16} />} fullWidth />
            <Input label="Phone Number" type="tel" placeholder="0712 345 678" value={form.phone}
              onChange={(e) => update('phone', e.target.value)} leftIcon={<Phone size={16} />} fullWidth
              hint="Your number is how you receive SMS price alerts and order updates" />
            <Select label="County" value={form.county}
              options={KENYA_COUNTIES.map((c) => ({ value: c, label: c }))}
              onChange={(e) => update('county', e.target.value)} fullWidth />
            <Select label="Contractor Type" value={form.type} options={CONTRACTOR_TYPES}
              onChange={(e) => update('type', e.target.value)} fullWidth />

            <div className="bg-sand border border-gray-200 rounded-xl p-4 text-xs text-concrete">
              <p className="font-semibold text-secondary mb-1">🔒 Your data is private</p>
              Suppliers only see your county (not your phone number) when responding to price queries.
            </div>

            <Button onClick={handleSendOTP} loading={loading} fullWidth size="lg" iconRight={<ArrowRight size={16} />}
              disabled={!form.name || !form.phone}>
              Send Verification Code
            </Button>
            <p className="text-center text-sm text-concrete">
              Already registered?{' '}
              <a href="/auth/login" className="text-primary font-semibold hover:underline">Sign in</a>
            </p>
          </motion.div>
        ) : (
          <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <Shield size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-secondary text-sm font-semibold">OTP Sent to {form.phone}</p>
                <p className="text-concrete text-xs">Valid for 10 minutes. Check your messages.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-secondary mb-3 block">Enter 6-digit code</label>
              <div className="flex gap-2">
                {otpDigits.map((digit, i) => (
                  <input key={i} id={`cotp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && i > 0) document.getElementById(`cotp-${i - 1}`)?.focus() }}
                    className="w-full h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white text-secondary" />
                ))}
              </div>
            </div>
            <Button onClick={handleVerify} loading={loading} fullWidth size="lg">
              Complete Registration
            </Button>
            <button onClick={() => setStep('info')} className="text-center text-sm text-concrete hover:text-primary">
              ← Change details
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
