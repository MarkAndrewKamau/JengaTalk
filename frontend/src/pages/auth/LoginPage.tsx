import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, Shield } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])

  const handleSendOTP = async () => {
    if (!phone.trim()) return
    setLoading(true)
    try {
      await authApi.login(phone)
      setStep('otp')
      toast.success('OTP sent to your phone')
    } catch {
      toast.error('Failed to send OTP. Check your number.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const code = otpDigits.join('')
    if (code.length < 6) return
    setLoading(true)
    try {
      const res = await authApi.verifyOTP({ phone, otp: code })
      const { user, token } = res.data
      setAuth(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      if (user.role === 'supplier') navigate('/supplier/overview')
      else if (user.role === 'contractor') navigate('/contractor/compare')
      else navigate('/admin/overview')
    } catch {
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otpDigits]
    next[index] = value
    setOtpDigits(next)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your JengaLink account">
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5"
          >
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={16} />}
              fullWidth
              hint="We'll send you a 6-digit verification code"
              onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
            />
            <Button onClick={handleSendOTP} loading={loading} fullWidth size="lg" iconRight={<ArrowRight size={16} />}>
              Send OTP
            </Button>
            <p className="text-center text-sm text-concrete">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-primary font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-5"
          >
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <Shield size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-secondary text-sm font-semibold">OTP Sent</p>
                <p className="text-concrete text-xs">Code sent to {phone}. Valid for 10 minutes.</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-secondary mb-3 block">Enter 6-digit code</label>
              <div className="flex gap-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    className="w-full h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white text-secondary"
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleVerifyOTP} loading={loading} fullWidth size="lg">
              Verify & Sign In
            </Button>

            <button
              onClick={() => { setStep('phone'); setOtpDigits(['', '', '', '', '', '']) }}
              className="text-center text-sm text-concrete hover:text-primary transition-colors"
            >
              ← Change phone number
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
