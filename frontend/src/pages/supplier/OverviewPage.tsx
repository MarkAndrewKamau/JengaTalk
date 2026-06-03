import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, DollarSign, Truck, MessageSquare,
  Eye, Package, ArrowRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { KPICard } from '../../components/ui/KPICard'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/Spinner'
import { analyticsApi } from '../../api/analytics'
import { ordersApi } from '../../api/orders'
import { smsApi } from '../../api/sms'
import { formatCurrency, timeAgo } from '../../utils/format'
import type { Order } from '../../types'

const demoRevenue = [
  { date: 'Jun 1', revenue: 45000 }, { date: 'Jun 2', revenue: 72000 },
  { date: 'Jun 3', revenue: 38000 }, { date: 'Jun 4', revenue: 91000 },
  { date: 'Jun 5', revenue: 65000 }, { date: 'Jun 6', revenue: 54000 },
  { date: 'Jun 7', revenue: 87000 }, { date: 'Jun 8', revenue: 76000 },
  { date: 'Jun 9', revenue: 94000 }, { date: 'Jun 10', revenue: 58000 },
  { date: 'Jun 11', revenue: 102000 }, { date: 'Jun 12', revenue: 88000 },
  { date: 'Jun 13', revenue: 71000 }, { date: 'Jun 14', revenue: 95000 },
]

function LiveFeed() {
  const { data: smsData } = useQuery({
    queryKey: ['sms-inbox'],
    queryFn: () => smsApi.inbox({ page: 1 }),
    refetchInterval: 30_000,
  })
  const items = smsData?.data?.logs || []

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live SMS Activity</CardTitle>
        <span className="flex items-center gap-1.5 text-xs text-success font-semibold">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Live
        </span>
      </CardHeader>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="text-center py-8 text-concrete text-sm">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
              No SMS activity yet
            </div>
          ) : (
            items.slice(0, 10).map((item: { id: string; from_phone: string; message: string; created_at: string }) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-secondary font-medium truncate">{item.from_phone}</p>
                  <p className="text-xs text-concrete truncate">{item.message}</p>
                </div>
                <span className="text-xs text-concrete/60 whitespace-nowrap">{timeAgo(item.created_at)}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

function OrderRow({ order, onAction }: { order: Order; onAction: (order: Order, action: string) => void }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group"
    >
      <td className="py-3.5 px-4 text-sm font-mono text-concrete">#{order.id.slice(-6).toUpperCase()}</td>
      <td className="py-3.5 px-4 text-sm font-medium text-secondary">{order.contractor?.name || '—'}</td>
      <td className="py-3.5 px-4 text-sm text-concrete">{order.contractor?.phone || '—'}</td>
      <td className="py-3.5 px-4 text-sm text-secondary">{order.items?.length || 0} item(s)</td>
      <td className="py-3.5 px-4 text-sm font-semibold text-secondary">{formatCurrency(order.total_amount)}</td>
      <td className="py-3.5 px-4"><StatusBadge status={order.status} /></td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {order.status === 'pending' && (
            <button onClick={() => onAction(order, 'confirm')}
              className="text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded-lg transition-all font-semibold">
              Confirm
            </button>
          )}
          {order.status === 'confirmed' && (
            <button onClick={() => onAction(order, 'dispatch')}
              className="text-xs bg-warning/10 text-warning hover:bg-warning hover:text-white px-2.5 py-1 rounded-lg transition-all font-semibold">
              Dispatch
            </button>
          )}
          <button onClick={() => onAction(order, 'view')}
            className="text-xs text-concrete hover:text-secondary transition-colors">
            <Eye size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

export function OverviewPage() {
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview(),
    refetchInterval: 60_000,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders-recent'],
    queryFn: () => ordersApi.list(),
  })

  // Backend returns { overview: {...} } and { orders: [...] }
  const kpis = kpiData?.data?.overview
  const orders = ordersData?.data?.orders || []
  const revenue = demoRevenue // backend revenue is aggregate totals; use demo for time-series chart

  const handleOrderAction = async (order: Order, action: string) => {
    // Will be handled with backend integration
    console.log('Action:', action, order.id)
  }

  if (kpiLoading && ordersLoading) return <PageLoader />

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Overview" subtitle="Here's what's happening with your business today" />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Orders Today"
            value={kpis?.total_orders_today ?? 0}
            icon={<ShoppingCart size={18} className="text-primary" />}
            iconBg="bg-primary/10"
            index={0}
          />
          <KPICard
            title="Revenue This Week"
            value={kpis?.revenue_this_week ?? 0}
            icon={<DollarSign size={18} className="text-success" />}
            iconBg="bg-success/10"
            prefix="KES "
            index={1}
          />
          <KPICard
            title="Pending Deliveries"
            value={kpis?.pending_deliveries ?? 0}
            icon={<Truck size={18} className="text-warning" />}
            iconBg="bg-warning/10"
            index={2}
          />
          <KPICard
            title="New SMS Enquiries"
            value={kpis?.new_enquiries ?? 0}
            icon={<MessageSquare size={18} className="text-blue-500" />}
            iconBg="bg-blue-500/10"
            index={3}
          />
        </div>

        {/* Chart + Live Feed */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue (Last 14 Days)</CardTitle>
                <div className="flex gap-2">
                  {['Week', 'Month'].map((p) => (
                    <button key={p} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-concrete hover:bg-primary/10 hover:text-primary transition-colors font-medium">
                      {p}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: unknown) => [formatCurrency(Number(v)), 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#E87722" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Live SMS feed */}
          <LiveFeed />
        </div>

        {/* Recent Orders */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg font-display text-secondary">Recent Orders</h3>
            <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}
              onClick={() => window.location.href = '/supplier/orders'}>
              View All
            </Button>
          </div>
          {ordersLoading ? (
            <PageLoader />
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-concrete">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Orders from contractors will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Order ID', 'Contractor', 'Phone', 'Items', 'Total', 'Status', 'Action'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-concrete uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order: Order) => (
                    <OrderRow key={order.id} order={order} onAction={handleOrderAction} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
