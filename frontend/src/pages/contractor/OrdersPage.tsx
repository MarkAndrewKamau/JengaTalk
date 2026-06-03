import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ClipboardList, AlertTriangle, ChevronRight } from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Drawer } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ordersApi } from '../../api/orders'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order, OrderStatus } from '../../types'
import toast from 'react-hot-toast'

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'dispatched', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'dispatched', label: 'On The Way' },
  { key: 'delivered', label: 'Delivered' },
]
const STATUS_IDX: Record<string, number> = { pending: 0, confirmed: 1, dispatched: 2, delivered: 3 }

export function ContractorOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contractor-orders', filter],
    queryFn: () => ordersApi.list({ status: filter === 'all' ? undefined : filter }),
  })

  const orders: Order[] = data?.data?.orders || []

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="My Orders" subtitle="Track all your material orders" />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.key ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-gray-200 text-concrete hover:border-primary/30 hover:text-primary'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? <PageLoader /> : orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={28} />}
            title="No orders yet"
            description="Your orders will appear here. Compare prices to get started."
            action={{ label: 'Compare Prices', onClick: () => window.location.href = '/contractor/compare' }}
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Order', 'Supplier', 'Items', 'Total', 'Status', 'Date', ''].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-concrete uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors"
                      onClick={() => setSelected(order)}>
                      <td className="py-3.5 px-4 text-sm font-mono text-primary font-semibold">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3.5 px-4 text-sm font-medium text-secondary">{order.supplier?.business_name || '—'}</td>
                      <td className="py-3.5 px-4 text-sm text-concrete">{order.items?.length || 0}</td>
                      <td className="py-3.5 px-4 text-sm font-bold text-secondary">{formatCurrency(order.total_amount)}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={order.status} /></td>
                      <td className="py-3.5 px-4 text-sm text-concrete">{formatDate(order.created_at)}</td>
                      <td className="py-3.5 px-4"><ChevronRight size={14} className="text-concrete" /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?.id.slice(-6).toUpperCase() || ''}`}>
        {selected && (
          <div className="p-6 flex flex-col gap-5">
            {/* Timeline */}
            <div>
              <h4 className="font-semibold text-sm text-concrete uppercase tracking-wide mb-3">Order Progress</h4>
              <div className="flex items-center">
                {ORDER_STEPS.map((step, i) => {
                  const done = i <= STATUS_IDX[selected.status]
                  const current = i === STATUS_IDX[selected.status]
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-success text-white' : 'bg-gray-200 text-concrete'}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs text-center ${current ? 'text-primary font-semibold' : done ? 'text-success' : 'text-concrete'}`}>{step.label}</span>
                      </div>
                      {i < ORDER_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 transition-all ${i < STATUS_IDX[selected.status] ? 'bg-success' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Supplier */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-secondary">{selected.supplier?.business_name}</p>
              <p className="text-xs text-concrete mt-0.5">{selected.supplier?.county}, {selected.supplier?.town}</p>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-sm text-concrete uppercase tracking-wide mb-3">Items</h4>
              {selected.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-2.5 border-b border-gray-100 text-sm">
                  <div>
                    <p className="font-medium text-secondary">{item.product?.material?.name}</p>
                    <p className="text-xs text-concrete">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-bold text-secondary">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-3 font-bold">
                <span className="text-secondary">Total</span>
                <span className="text-primary text-lg">{formatCurrency(selected.total_amount)}</span>
              </div>
            </div>

            {/* Report issue */}
            <Button variant="outline" fullWidth icon={<AlertTriangle size={14} />}
              onClick={() => { toast.success('Dispute reported. Our team will contact you within 24 hours.') }}>
              Report Issue
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
