import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, Inbox, Radio, Settings, Clock,
  ArrowUpRight, ArrowDownLeft, Calendar
} from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/Spinner'
import { smsApi } from '../../api/sms'
import { maskPhone, timeAgo } from '../../utils/format'
import type { SMSLog } from '../../types'
import toast from 'react-hot-toast'

const SMS_TABS = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'broadcast', label: 'Broadcast', icon: Radio },
  { key: 'auto', label: 'Auto-Reply', icon: Settings },
]

const SMS_TAGS: Record<string, { label: string; variant: 'primary' | 'success' | 'danger' | 'info' | 'default' }> = {
  enquiry: { label: 'Price Enquiry', variant: 'primary' },
  order: { label: 'Order', variant: 'success' },
  complaint: { label: 'Complaint', variant: 'danger' },
  other: { label: 'Other', variant: 'default' },
}

function SMSItem({ sms, onReply }: { sms: SMSLog; onReply: (sms: SMSLog) => void }) {
  const tag = sms.message_type === 'enquiry' ? 'enquiry' : sms.message_type === 'order' ? 'order' : 'other'
  const tagInfo = SMS_TAGS[tag]

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer"
      onClick={() => onReply(sms)}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${sms.direction === 'in' ? 'bg-primary/10' : 'bg-success/10'}`}>
        {sms.direction === 'in' ? (
          <ArrowDownLeft size={16} className="text-primary" />
        ) : (
          <ArrowUpRight size={16} className="text-success" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-secondary">{maskPhone(sms.from_phone)}</span>
          <Badge variant={tagInfo.variant} className="text-xs">{tagInfo.label}</Badge>
        </div>
        <p className="text-sm text-concrete line-clamp-2">{sms.message}</p>
      </div>
      <div className="text-xs text-concrete/60 whitespace-nowrap shrink-0">{timeAgo(sms.created_at)}</div>
    </motion.div>
  )
}

export function SMSCenterPage() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [replyTo, setReplyTo] = useState<SMSLog | null>(null)
  const [replyText, setReplyText] = useState('')
  const [broadcastText, setBroadcastText] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [autoHours, setAutoHours] = useState({ open: '07:00', close: '18:00' })

  const { data, isLoading } = useQuery({
    queryKey: ['sms-inbox'],
    queryFn: () => smsApi.inbox({ page: 1 }),
    refetchInterval: 15_000,
  })

  const sendMutation = useMutation({
    mutationFn: ({ to, message }: { to: string; message: string }) => smsApi.send(to, message),
    onSuccess: () => {
      toast.success('Reply sent')
      setReplyTo(null)
      setReplyText('')
    },
    onError: () => toast.error('Failed to send SMS'),
  })

  const broadcastMutation = useMutation({
    mutationFn: ({ message, scheduled_at }: { message: string; scheduled_at?: string }) =>
      smsApi.broadcast(message, scheduled_at || undefined),
    onSuccess: () => {
      toast.success('Broadcast queued — contractors will be notified')
      setBroadcastText('')
      setScheduledAt('')
    },
    onError: () => toast.error('Failed to send broadcast'),
  })

  const smsLogs: SMSLog[] = data?.data?.logs || []

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="SMS Center" subtitle="Manage all SMS communication with contractors" />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar tabs */}
        <div className="w-48 border-r border-gray-100 bg-white flex flex-col">
          {SMS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-l-2 ${
                activeTab === tab.key
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-concrete hover:text-secondary hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Inbox ── */}
            {activeTab === 'inbox' && (
              <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
                  <Input placeholder="Search messages…" className="flex-1" />
                  <select className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-secondary bg-white">
                    <option>All Types</option>
                    <option>Price Enquiry</option>
                    <option>Order</option>
                    <option>Complaint</option>
                  </select>
                </div>

                {isLoading ? <PageLoader /> : smsLogs.length === 0 ? (
                  <div className="text-center py-16 text-concrete">
                    <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Incoming SMS from contractors will appear here</p>
                  </div>
                ) : (
                  <div>
                    {smsLogs.map((sms) => (
                      <SMSItem key={sms.id} sms={sms} onReply={setReplyTo} />
                    ))}
                  </div>
                )}

                {/* Reply panel */}
                <AnimatePresence>
                  {replyTo && (
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="fixed bottom-0 left-0 right-0 lg:left-[calc(240px+192px)] bg-white border-t-2 border-primary/20 p-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-secondary">Reply to {maskPhone(replyTo.from_phone)}</p>
                          <p className="text-xs text-concrete line-clamp-1">{replyTo.message}</p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-concrete hover:text-danger text-xs">Close</button>
                      </div>
                      <div className="flex gap-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          placeholder="Type your reply… (160 chars = 1 SMS)"
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <Button
                          icon={<Send size={16} />}
                          loading={sendMutation.isPending}
                          onClick={() => sendMutation.mutate({ to: replyTo.from_phone, message: replyText })}
                          disabled={!replyText}
                          className="self-end"
                        >
                          Reply
                        </Button>
                      </div>
                      <p className="text-xs text-concrete mt-1">{replyText.length}/160 chars · {Math.ceil(replyText.length / 160)} SMS</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Broadcast ── */}
            {activeTab === 'broadcast' && (
              <motion.div key="broadcast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Broadcast SMS</CardTitle>
                  </CardHeader>
                  <div className="flex flex-col gap-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-secondary">
                      <strong>Send to:</strong> All contractors who have interacted with your listings via SMS
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-secondary block mb-2">Message</label>
                      <textarea
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        rows={5}
                        placeholder="Compose your broadcast message…"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                      <div className="flex justify-between text-xs text-concrete mt-1">
                        <span>{broadcastText.length} characters</span>
                        <span>{Math.ceil(broadcastText.length / 160)} SMS unit(s) × subscribers</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-secondary block mb-2">
                          <Calendar size={13} className="inline mr-1.5" />
                          Schedule (optional)
                        </label>
                        <input type="datetime-local" value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                      </div>
                      <div className="flex items-end">
                        <div className="bg-gray-50 rounded-xl p-3 text-xs text-concrete w-full">
                          <p className="font-semibold text-secondary mb-1">Preview</p>
                          <p className="line-clamp-3">{broadcastText || 'Your message will appear here…'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" fullWidth
                        onClick={() => broadcastMutation.mutate({ message: broadcastText, scheduled_at: scheduledAt })}
                        loading={broadcastMutation.isPending && !!scheduledAt}
                        icon={<Clock size={16} />}
                        disabled={!broadcastText || !scheduledAt}
                      >
                        Schedule
                      </Button>
                      <Button fullWidth
                        onClick={() => broadcastMutation.mutate({ message: broadcastText })}
                        loading={broadcastMutation.isPending && !scheduledAt}
                        icon={<Send size={16} />}
                        disabled={!broadcastText}
                      >
                        Send Now
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Auto-Reply ── */}
            {activeTab === 'auto' && (
              <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                <div className="flex flex-col gap-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Hours</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-secondary block mb-2">Opening Time</label>
                        <input type="time" value={autoHours.open}
                          onChange={(e) => setAutoHours((h) => ({ ...h, open: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-secondary block mb-2">Closing Time</label>
                        <input type="time" value={autoHours.close}
                          onChange={(e) => setAutoHours((h) => ({ ...h, close: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-xl p-3 text-xs text-concrete">
                      Outside business hours auto-reply: <em>"Thanks for contacting [Business]. We're currently closed. We'll respond by {autoHours.open} tomorrow."</em>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Out-of-Stock Auto-Reply</CardTitle>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-primary transition-colors" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                      </label>
                    </CardHeader>
                    <p className="text-sm text-concrete">When a contractor queries a material that's out of stock, auto-reply with:</p>
                    <div className="mt-3 bg-gray-50 rounded-xl p-3 text-sm italic text-secondary">
                      "Sorry, [Material] is currently out of stock at [Business]. We expect restock within [X] days. Reply ALERT [material] to be notified when available."
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
