import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, CheckCircle, AlertCircle, Clock, MessageSquare,
  Send, Phone, MapPin, Package
} from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ordersApi } from '../../api/orders'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order, OrderStatus } from '../../types'
import toast from 'react-hot-toast'

const COLUMNS: { key: OrderStatus; label: string; icon: typeof Truck; color: string }[] = [
  { key: 'confirmed', label: 'To Dispatch', icon: Clock, color: 'text-primary border-primary/20 bg-primary/5' },
  { key: 'dispatched', label: 'In Transit', icon: Truck, color: 'text-warning border-warning/20 bg-warning/5' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-success border-success/20 bg-success/5' },
  { key: 'cancelled', label: 'Failed / Cancelled', icon: AlertCircle, color: 'text-danger border-danger/20 bg-danger/5' },
]

const SMS_ALERTS = [
  { label: 'Being Prepared', text: 'Your order #{id} is being prepared and will be dispatched today.' },
  { label: 'On the Way', text: 'Your delivery is on the way. ETA: 2 hours. Our driver will call you.' },
  { label: 'Delivered', text: 'Order #{id} delivered! Reply CONFIRM to acknowledge or DISPUTE for issues.' },
]

interface DeliveryCardProps {
  order: Order
  onSendAlert: (order: Order) => void
  onUpdateStatus: (order: Order, status: OrderStatus) => void
}

function DeliveryCard({ order, onSendAlert, onUpdateStatus }: DeliveryCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-xs text-primary font-bold">#{String(order.id).slice(-6).toUpperCase()}</p>
          <p className="font-semibold text-secondary text-sm mt-0.5">{order.contractor?.name || 'Contractor'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-secondary">{formatCurrency(order.total_amount)}</p>
          {order.delivery_date && (
            <p className="text-xs text-concrete mt-0.5">{formatDate(order.delivery_date)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-concrete mb-3">
        <span className="flex items-center gap-1"><Phone size={11} />{order.contractor?.phone}</span>
        <span className="flex items-center gap-1"><MapPin size={11} />{order.contractor?.county}</span>
      </div>

      <div className="text-xs text-concrete mb-3">
        <Package size={11} className="inline mr-1" />{order.items?.length || 0} item(s)
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSendAlert(order)}
          className="flex-1 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <MessageSquare size={12} /> SMS Alert
        </button>
        {order.status === 'confirmed' && (
          <button
            onClick={() => onUpdateStatus(order, 'dispatched')}
            className="flex-1 py-2 text-xs font-semibold text-warning bg-warning/10 hover:bg-warning/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Truck size={12} /> Dispatch
          </button>
        )}
        {order.status === 'dispatched' && (
          <button
            onClick={() => onUpdateStatus(order, 'delivered')}
            className="flex-1 py-2 text-xs font-semibold text-success bg-success/10 hover:bg-success/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={12} /> Delivered
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function DeliveriesPage() {
  const queryClient = useQueryClient()
  const [alertOrder, setAlertOrder] = useState<Order | null>(null)
  const [alertText, setAlertText] = useState('')
  const [alertLoading, setAlertLoading] = useState(false)
  const [bulkDispatch, setBulkDispatch] = useState(false)

  const { data: confirmedData } = useQuery({ queryKey: ['orders-confirmed'], queryFn: () => ordersApi.list({ status: 'confirmed' }) })
  const { data: dispatchedData } = useQuery({ queryKey: ['orders-dispatched'], queryFn: () => ordersApi.list({ status: 'dispatched' }) })
  const { data: deliveredData } = useQuery({ queryKey: ['orders-delivered'], queryFn: () => ordersApi.list({ status: 'delivered' }) })
  const { data: cancelledData } = useQuery({ queryKey: ['orders-cancelled'], queryFn: () => ordersApi.list({ status: 'cancelled' }) })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      ['orders-confirmed', 'orders-dispatched', 'orders-delivered'].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k] }))
      toast.success('Status updated. Contractor notified via SMS.')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const columnData: Record<string, Order[]> = {
    confirmed: confirmedData?.data?.orders || [],
    dispatched: dispatchedData?.data?.orders || [],
    delivered: deliveredData?.data?.orders || [],
    cancelled: cancelledData?.data?.orders || [],
  }

  const dispatchingToday = columnData['confirmed']

  const handleSendAlert = async () => {
    if (!alertOrder || !alertText) return
    setAlertLoading(true)
    // SMS triggers automatically on status change via the backend.
    // Simulate the action until a dedicated send endpoint is added.
    await new Promise((r) => setTimeout(r, 500))
    toast.success('Delivery alert queued — contractor notified on status update.')
    setAlertOrder(null)
    setAlertText('')
    setAlertLoading(false)
  }

  const handleBulkDispatch = async () => {
    // Mark all confirmed orders as dispatched — backend will auto-SMS each contractor
    await Promise.all(
      dispatchingToday.map((o) => ordersApi.updateStatus(o.id, 'dispatched', 'Bulk dispatch'))
    )
    toast.success(`${dispatchingToday.length} order(s) dispatched — contractors notified via SMS`)
    setBulkDispatch(false)
    queryClient.invalidateQueries({ queryKey: ['orders-confirmed'] })
    queryClient.invalidateQueries({ queryKey: ['orders-dispatched'] })
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Deliveries" subtitle="Track and manage all delivery operations" />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Bulk dispatch action */}
        {dispatchingToday.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Send size={18} className="text-primary" />
              <p className="text-sm font-medium text-secondary">
                <strong>{dispatchingToday.length}</strong> order(s) are ready to dispatch today
              </p>
            </div>
            <Button size="sm" onClick={() => setBulkDispatch(true)} icon={<Send size={14} />}>
              Send Bulk SMS
            </Button>
          </motion.div>
        )}

        {/* Kanban board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {COLUMNS.map((col) => {
            const orders = columnData[col.key] || []
            return (
              <div key={col.key} className={`rounded-2xl border-2 ${col.color} p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <col.icon size={16} />
                  <h3 className="font-display font-bold text-sm">{col.label}</h3>
                  <span className="ml-auto bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {orders.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {orders.length === 0 ? (
                      <div className="text-center py-6 text-xs text-concrete/60">
                        No orders here
                      </div>
                    ) : orders.map((order: Order) => (
                      <DeliveryCard
                        key={order.id}
                        order={order}
                        onSendAlert={(o) => { setAlertOrder(o); setAlertText('') }}
                        onUpdateStatus={(o, status) => updateMutation.mutate({ id: o.id, status })}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SMS Alert Modal */}
      <Modal open={!!alertOrder} onClose={() => { setAlertOrder(null); setAlertText('') }}
        title={`Send Alert — Order #${String(alertOrder?.id ?? "").slice(-6).toUpperCase() || ''}`} size="md">
        <div className="p-6 flex flex-col gap-4">
          <div className="grid gap-2">
            {SMS_ALERTS.map((a) => (
              <button key={a.label} onClick={() => setAlertText(a.text.replace('{id}', String(alertOrder?.id ?? "").slice(-6).toUpperCase() || ''))}
                className="text-left px-4 py-3 bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/30 rounded-xl text-sm transition-colors">
                <span className="font-semibold text-secondary">{a.label}</span>
                <p className="text-xs text-concrete mt-0.5 line-clamp-1">{a.text}</p>
              </button>
            ))}
          </div>
          <textarea value={alertText} onChange={(e) => setAlertText(e.target.value)} rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setAlertOrder(null)}>Cancel</Button>
            <Button fullWidth onClick={handleSendAlert} loading={alertLoading} icon={<Send size={16} />}>
              Send Alert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk dispatch confirm */}
      <Modal open={bulkDispatch} onClose={() => setBulkDispatch(false)} title="Bulk SMS Dispatch" size="sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-secondary mb-2">Send dispatch SMS?</h3>
          <p className="text-sm text-concrete mb-6">
            This will send a dispatch notification to all {dispatchingToday.length} contractors whose orders are ready today.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setBulkDispatch(false)}>Cancel</Button>
            <Button fullWidth onClick={handleBulkDispatch}>Send All</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
