import { Users, Package, ShoppingCart, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { KPICard } from '../../components/ui/KPICard'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'

const recentSuppliers = [
  { name: 'BuildMart Kenya', county: 'Nairobi', status: 'approved', date: '2025-06-01' },
  { name: 'Coast Hardware', county: 'Mombasa', status: 'pending', date: '2025-06-02' },
  { name: 'Nakuru Supplies', county: 'Nakuru', status: 'approved', date: '2025-06-03' },
  { name: 'Western Builders', county: 'Kakamega', status: 'pending', date: '2025-06-03' },
]

const smsVolume = [
  { date: 'Jun 1', sms: 340 }, { date: 'Jun 2', sms: 520 },
  { date: 'Jun 3', sms: 410 }, { date: 'Jun 4', sms: 680 },
  { date: 'Jun 5', sms: 590 }, { date: 'Jun 6', sms: 720 },
  { date: 'Jun 7', sms: 650 },
]

export function AdminOverviewPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Platform Overview" subtitle="JengaLink platform health and metrics" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KPICard title="Total Suppliers" value={847} change={12} icon={<Users size={18} className="text-primary" />} iconBg="bg-primary/10" index={0} />
          <KPICard title="Total Contractors" value={5214} change={8} icon={<Package size={18} className="text-success" />} iconBg="bg-success/10" index={1} />
          <KPICard title="Orders This Month" value={1842} change={22} icon={<ShoppingCart size={18} className="text-warning" />} iconBg="bg-warning/10" index={2} />
          <KPICard title="SMS Today" value={1240} change={5} icon={<MessageSquare size={18} className="text-blue-500" />} iconBg="bg-blue-500/10" index={3} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          <Card>
            <CardHeader><CardTitle>Daily SMS Volume</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={smsVolume} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0' }} />
                <Bar dataKey="sms" name="SMS Messages" fill="#E87722" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardHeader><CardTitle>Supplier Applications</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              {recentSuppliers.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-secondary text-sm">{s.name}</p>
                    <p className="text-xs text-concrete">{s.county} · {s.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {s.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                    {s.status === 'pending' && (
                      <div className="flex gap-1">
                        <button className="p-1.5 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors">
                          <CheckCircle size={13} />
                        </button>
                        <button className="p-1.5 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors">
                          <XCircle size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Platform health */}
        <Card>
          <CardHeader><CardTitle>Platform Health</CardTitle></CardHeader>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'SMS API Status', value: 'Operational', color: 'text-success bg-success/10' },
              { label: 'USSD Gateway', value: 'Operational', color: 'text-success bg-success/10' },
              { label: 'Order Fulfilment', value: '94.2%', color: 'text-primary bg-primary/10' },
              { label: 'Avg Response Time', value: '1.4s', color: 'text-blue-600 bg-blue-100' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-xl p-4 text-center`}>
                <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
                <p className="font-display font-bold text-lg">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
