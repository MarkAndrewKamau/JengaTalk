import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search, Filter, MessageSquare, CheckCircle, XCircle,
  Truck, Phone, MapPin, ChevronRight
} from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Drawer, Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/Spinner'
import { ordersApi } from '../../api/orders'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order, OrderStatus } from '../../types'
import toast from 'react-hot-toast'

const SMS_TEMPLATES = [
  { label: 'Order Confirmed', text: 'Your order has been confirmed and is being prepared for delivery.' },
  { label: 'Out of Stock', text: 'Unfortunately one or more items in your order are currently out of stock. We will contact you shortly.' },
  { label: 'Price Changed', text: 'Please note that the price for one or more items in your order has changed. Kindly confirm to proceed.' },
  { label: 'Delivery Update', text: 'Your delivery is scheduled for tomorrow. Our driver will call you 30 minutes before arrival.' },
]

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const ORDER_TIMELINE = [
  { status: 'pending', label: 'Order Placed', icon: CheckCircle },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'dispatched', label: 'Dispatched', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
]

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'dispatched', 'delivered']

function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(status)
  return (
    <div className="flex items-center gap-2">
      {ORDER_TIMELINE.map((step, i) => (
        <div key={step.status} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${
            i <= currentIdx ? 'text-success' : i === currentIdx + 1 ? 'text-primary' : 'text-concrete/40'
          }`}>
            <step.icon size={14} className={i <= currentIdx ? 'text-success' : i === currentIdx + 1 ? 'text-primary' : 'text-concrete/30'} />
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < ORDER_TIMELINE.length - 1 && (
            <div className={`flex-1 h-0.5 w-8 rounded ${i < currentIdx ? 'bg-success' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function OrdersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [smsModal, setSmsModal] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsLoading, setSmsLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.list({ status: statusFilter === 'all' ? undefined : statusFilter }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order status updated. SMS sent to contractor.')
      setSelectedOrder(null)
    },
    onError: () => toast.error('Failed to update order status'),
  })

  const orders: Order[] = data?.data?.data?.data || []

  const filtered = orders.filter((o) =>
    !search || o.contractor?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id.includes(search)
  )

  const handleSendSMS = async () => {
    if (!selectedOrder || !smsMessage) return
    setSmsLoading(true)
    try {
      await ordersApi.sendSMS(selectedOrder.id, smsMessage)
      toast.success('SMS sent successfully')
      setSmsModal(false)
      setSmsMessage('')
    } catch {
      toast.error('Failed to send SMS')
    } finally {
      setSmsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Orders" subtitle="Manage and track all contractor orders" />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <Input placeholder="Search orders…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />} className="min-w-48 flex-1" />
          <Select value={statusFilter}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')} />
        </div>

        {/* Orders table */}
        {isLoading ? <PageLoader /> : (
          <Card padding="none">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-concrete">
                <Filter size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Order', 'Contractor', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-concrete uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="py-3.5 px-4 text-sm font-mono text-primary font-semibold">
                          #{order.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-medium text-secondary">{order.contractor?.name || '—'}</p>
                          <p className="text-xs text-concrete">{order.contractor?.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-concrete">{order.items?.length || 0} item(s)</td>
                        <td className="py-3.5 px-4 text-sm font-bold text-secondary">{formatCurrency(order.total_amount)}</td>
                        <td className="py-3.5 px-4"><StatusBadge status={order.status} /></td>
                        <td className="py-3.5 px-4 text-sm text-concrete">{formatDate(order.created_at)}</td>
                        <td className="py-3.5 px-4">
                          <ChevronRight size={16} className="text-concrete opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Order Detail Drawer */}
      <Drawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder ? `Order #${selectedOrder.id.slice(-6).toUpperCase()}` : ''}>
        {selectedOrder && (
          <div className="p-6 flex flex-col gap-5">
            {/* Contractor info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-sm text-concrete uppercase tracking-wide mb-3">Contractor</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">{selectedOrder.contractor?.name?.[0] || 'C'}</span>
                </div>
                <div>
                  <p className="font-semibold text-secondary">{selectedOrder.contractor?.name}</p>
                  <div className="flex items-center gap-3 text-xs text-concrete mt-0.5">
                    <span className="flex items-center gap-1"><Phone size={11} />{selectedOrder.contractor?.phone}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{selectedOrder.contractor?.county}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-sm text-concrete uppercase tracking-wide mb-3">Order Items</h4>
              <div className="flex flex-col gap-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-medium text-sm text-secondary">{item.product?.material?.name || 'Material'}</p>
                      <p className="text-xs text-concrete">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                    </div>
                    <p className="font-bold text-secondary">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-secondary/5 rounded-xl border border-secondary/10">
                  <span className="font-bold text-secondary">Total</span>
                  <span className="font-bold text-primary text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-semibold text-sm text-concrete uppercase tracking-wide mb-3">Order Timeline</h4>
              <OrderTimeline status={selectedOrder.status} />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              {selectedOrder.status === 'pending' && (
                <>
                  <Button fullWidth onClick={() => updateMutation.mutate({ id: selectedOrder.id, status: 'confirmed' })}
                    loading={updateMutation.isPending} icon={<CheckCircle size={16} />}>
                    Confirm Order
                  </Button>
                  <Button fullWidth variant="danger" onClick={() => updateMutation.mutate({ id: selectedOrder.id, status: 'cancelled' })}
                    icon={<XCircle size={16} />}>
                    Reject Order
                  </Button>
                </>
              )}
              {selectedOrder.status === 'confirmed' && (
                <Button fullWidth onClick={() => updateMutation.mutate({ id: selectedOrder.id, status: 'dispatched' })}
                  loading={updateMutation.isPending} icon={<Truck size={16} />}>
                  Mark as Dispatched
                </Button>
              )}
              {selectedOrder.status === 'dispatched' && (
                <Button fullWidth variant="secondary" onClick={() => updateMutation.mutate({ id: selectedOrder.id, status: 'delivered' })}
                  loading={updateMutation.isPending} icon={<CheckCircle size={16} />}>
                  Mark as Delivered
                </Button>
              )}
              <Button fullWidth variant="outline" onClick={() => setSmsModal(true)} icon={<MessageSquare size={16} />}>
                Send Custom SMS
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* SMS Modal */}
      <Modal open={smsModal} onClose={() => { setSmsModal(false); setSmsMessage('') }} title="Send SMS to Contractor" size="md">
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {SMS_TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => setSmsMessage(t.text)}
                className="text-left px-3 py-2.5 bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/30 rounded-xl text-xs font-medium text-secondary transition-colors">
                {t.label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-semibold text-secondary block mb-2">Message</label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary placeholder:text-concrete/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Type your message…"
            />
            <div className="flex justify-between text-xs text-concrete mt-1">
              <span>{smsMessage.length} characters</span>
              <span>{Math.ceil(smsMessage.length / 160)} SMS unit(s)</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setSmsModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleSendSMS} loading={smsLoading} icon={<MessageSquare size={16} />}>
              Send SMS
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
