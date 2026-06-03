import { motion } from 'framer-motion'
import { Bell, Truck, DollarSign, Package, MessageSquare, X } from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Badge } from '../../components/ui/Badge'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { timeAgo } from '../../utils/format'

// Will be replaced with real data from backend
const DEMO_NOTIFICATIONS = [
  { id: '1', type: 'delivery', title: 'Order dispatched', message: 'BuildMart has dispatched your order #A1F342. Driver: James, 0722-xxx-xxx. ETA: 2 hours.', time: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: '2', type: 'price_alert', title: 'Price Alert Triggered', message: 'OPC Cement is now KES 700/bag at ProHardware in Nairobi. Reply ORDER PH01 to buy.', time: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
  { id: '3', type: 'order', title: 'Order Confirmed', message: 'Your order #A1F341 for 100 bags of OPC Cement has been confirmed by NaiHardware.', time: new Date(Date.now() - 2 * 3600000).toISOString(), read: true },
  { id: '4', type: 'delivery', title: 'Order Delivered', message: 'Order #A1F340 delivered! Reply CONFIRM to acknowledge receipt or DISPUTE if there\'s an issue.', time: new Date(Date.now() - 24 * 3600000).toISOString(), read: true },
  { id: '5', type: 'sms', title: 'SMS from BuildMart', message: 'Hi! We have a special offer on OPC Cement this week — KES 695/bag for orders above 100 bags.', time: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), read: true },
]

const ICON_MAP: Record<string, typeof Bell> = {
  delivery: Truck,
  price_alert: DollarSign,
  order: Package,
  sms: MessageSquare,
}

const ICON_BG: Record<string, string> = {
  delivery: 'bg-warning/10 text-warning',
  price_alert: 'bg-success/10 text-success',
  order: 'bg-primary/10 text-primary',
  sms: 'bg-blue-100 text-blue-600',
}

export function NotificationsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Notifications" subtitle="Stay on top of your orders, deliveries, and price alerts" />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Notifications list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-secondary">All Notifications</h3>
              <button className="text-xs text-primary hover:underline font-medium">Mark all as read</button>
            </div>

            <div className="flex flex-col gap-2">
              {DEMO_NOTIFICATIONS.map((notif, i) => {
                const Icon = ICON_MAP[notif.type] || Bell
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                      !notif.read ? 'bg-white border-primary/20 shadow-sm' : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[notif.type]}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-semibold ${notif.read ? 'text-concrete' : 'text-secondary'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                      </div>
                      <p className="text-sm text-concrete leading-relaxed">{notif.message}</p>
                    </div>
                    <span className="text-xs text-concrete/60 whitespace-nowrap shrink-0">{timeAgo(notif.time)}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Active price alerts */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Alerts</CardTitle>
                <Badge variant="primary">2 active</Badge>
              </CardHeader>
              <div className="flex flex-col gap-3">
                {[
                  { material: 'OPC Cement', target: 'KES 700/bag', county: 'Nairobi' },
                  { material: '3/4 Ballast', target: 'KES 2,500/tonne', county: 'Kisumu' },
                ].map((alert) => (
                  <div key={alert.material} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-3">
                    <div>
                      <p className="font-semibold text-secondary text-sm">{alert.material}</p>
                      <p className="text-xs text-concrete">{alert.target} · {alert.county}</p>
                    </div>
                    <button className="text-concrete hover:text-danger transition-colors p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" fullWidth>+ Add Alert</Button>
              </div>
            </Card>

            <Card variant="dark">
              <div className="text-center">
                <MessageSquare size={24} className="text-primary mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">SMS Alerts Active</p>
                <p className="text-white/50 text-sm">You'll receive SMS notifications for order updates and price drops</p>
                <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
                  <p className="text-white/60 text-xs">Your number</p>
                  <p className="text-white font-mono font-bold">+254 7** *** 678</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
