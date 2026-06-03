import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/Spinner'
import { analyticsApi } from '../../api/analytics'
import { formatCurrency } from '../../utils/format'
import { CATEGORY_LABELS } from '../../types'

const COLORS = ['#E87722', '#2D9E5C', '#1C2128', '#8B9094', '#D69E2E', '#3B82F6', '#EC4899']

// Demo data for MVP (replaced when backend is ready)
const demoMaterials = [
  { name: 'OPC Cement', queries: 342, orders: 89 },
  { name: 'BRC Wire Mesh', queries: 210, orders: 54 },
  { name: 'Corrugated Sheets', queries: 185, orders: 42 },
  { name: 'Red Bricks', queries: 156, orders: 31 },
  { name: '3/4 Ballast', queries: 134, orders: 28 },
]

const demoCategoryRevenue = Object.values(CATEGORY_LABELS).map((label) => ({
  name: label.replace(' & ', ' &\n'),
  value: Math.floor(Math.random() * 80000 + 20000),
}))

const demoHeatmap = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 12 }, (_, hour) => ({
    day, hour: hour + 7,
    value: Math.floor(Math.random() * 40 + (hour > 1 && hour < 6 ? 20 : 2)),
  }))
).flat()

const demoFunnel = [
  { value: 1200, name: 'SMS Enquiries' },
  { value: 450, name: 'Price Views' },
  { value: 180, name: 'Quote Requests' },
  { value: 89, name: 'Orders Placed' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-secondary text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-white/70">{p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}</p>
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const { isLoading } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: () => analyticsApi.products(),
  })

  useQuery({
    queryKey: ['analytics-revenue', 'month'],
    queryFn: () => analyticsApi.revenue({ period: 'month' }),
  })


  if (isLoading) return <PageLoader />

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Analytics" subtitle="Understand your business performance and price positioning" />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid gap-5">

          {/* Row 1: Top materials + Funnel */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Most Queried Materials</CardTitle>
                <span className="text-xs text-concrete">This week</span>
              </CardHeader>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={demoMaterials} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#1C2128' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="queries" name="SMS Queries" fill="#E87722" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="orders" name="Orders" fill="#2D9E5C" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS → Order Conversion</CardTitle>
                <span className="text-xs text-concrete px-2 py-1 bg-success/10 text-success rounded-lg font-semibold">
                  7.4% rate
                </span>
              </CardHeader>
              <div className="flex flex-col gap-2 mt-2">
                {demoFunnel.map((item, i) => {
                  const pct = Math.round((item.value / demoFunnel[0].value) * 100)
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary font-medium">{item.name}</span>
                        <span className="text-concrete">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-xl overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1, duration: 0.6 }}
                          className="h-full rounded-xl flex items-center justify-end pr-2"
                          style={{ background: COLORS[i] }}
                        >
                          <span className="text-white text-xs font-bold">{pct}%</span>
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Row 2: Revenue by category + Repeat rate */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                  <span className="text-xs text-concrete">This month</span>
                </CardHeader>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={demoCategoryRevenue} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B9094' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Revenue" radius={[6, 6, 0, 0]}>
                      {demoCategoryRevenue.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Repeat Contractor Rate', value: '38%', color: 'text-success', bg: 'bg-success/10' },
                  { label: 'Avg Order Value', value: 'KES 45,200', color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'SMS → Quote Rate', value: '37.5%', color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'On-time Delivery', value: '91%', color: 'text-success', bg: 'bg-success/10' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3.5`}>
                    <p className="text-xs text-concrete mb-1">{label}</p>
                    <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 3: Peak hours heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Peak SMS Query Times</CardTitle>
              <span className="text-xs text-concrete">Hour of day</span>
            </CardHeader>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(12, 1fr)` }}>
                  <div />
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="text-center text-xs text-concrete py-1">{i + 7}:00</div>
                  ))}
                  {DAYS.map((day, dayIdx) => (
                    <>
                      <div key={`day-${day}`} className="text-xs text-concrete flex items-center font-medium">{day}</div>
                      {Array.from({ length: 12 }, (_, hourIdx) => {
                        const item = demoHeatmap.find((h) => h.day === dayIdx && h.hour === hourIdx + 7)
                        const intensity = item ? item.value / 40 : 0
                        return (
                          <div
                            key={`${day}-${hourIdx}`}
                            className="h-8 rounded-md transition-colors"
                            style={{ background: `rgba(232, 119, 34, ${Math.min(intensity, 1)})` }}
                            title={`${day} ${hourIdx + 7}:00 — ${item?.value || 0} queries`}
                          />
                        )
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Price intelligence */}
          <Card>
            <CardHeader>
              <CardTitle>Price Intelligence</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2.5 py-1 rounded-lg font-semibold">
                <AlertTriangle size={12} /> 2 products above avg
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Material', 'Your Price', 'Platform Avg', 'Difference', 'Status'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-concrete uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'OPC Cement', yours: 720, avg: 735, diff: -2 },
                    { name: 'BRC Wire Mesh', yours: 1850, avg: 1700, diff: 8.8 },
                    { name: 'Corrugated Sheets', yours: 890, avg: 920, diff: -3.3 },
                    { name: 'Red Bricks (per 1000)', yours: 14500, avg: 13800, diff: 5.1 },
                  ].map((item) => (
                    <tr key={item.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-secondary text-sm">{item.name}</td>
                      <td className="py-3.5 px-4 font-bold text-primary text-sm">{formatCurrency(item.yours)}</td>
                      <td className="py-3.5 px-4 text-sm text-concrete">{formatCurrency(item.avg)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-sm font-semibold flex items-center gap-1 ${item.diff > 0 ? 'text-warning' : 'text-success'}`}>
                          {item.diff > 0 ? '↑' : '↓'} {Math.abs(item.diff)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.diff > 7 ? (
                          <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-lg font-semibold">Review pricing</span>
                        ) : item.diff < 0 ? (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-lg font-semibold">Competitive</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-concrete px-2 py-1 rounded-lg">On par</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
