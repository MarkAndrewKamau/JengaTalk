import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Star, Truck, CheckCircle, AlertCircle,
  Bell, MapPin, ArrowRight, TrendingDown, X, Share2, Download
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { productsApi } from '../../api/products'
import { formatCurrency } from '../../utils/format'
import type { SupplierProduct } from '../../types'
import toast from 'react-hot-toast'

const KENYA_COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos']

const SUGGESTIONS = [
  'OPC Cement', 'BRC Wire Mesh', 'Corrugated Sheets', 'Red Bricks',
  '3/4 Ballast', 'River Sand', 'Timber (2x4)', 'Roofing Nails',
]

const PRICE_HISTORY_DEMO = [
  { date: 'May 1', price: 750 }, { date: 'May 7', price: 740 },
  { date: 'May 14', price: 760 }, { date: 'May 21', price: 735 },
  { date: 'May 28', price: 720 }, { date: 'Jun 3', price: 720 },
]

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <Badge variant="danger">Out of Stock</Badge>
  if (qty < 20) return <Badge variant="warning">Limited</Badge>
  return <Badge variant="success">In Stock</Badge>
}

function SupplierResultCard({
  product,
  rank,
  pinned,
  onPin,
  onOrder,
  onQuote,
}: {
  product: SupplierProduct
  rank: number
  pinned: boolean
  onPin: () => void
  onOrder: () => void
  onQuote: () => void
}) {
  const isBestPrice = rank === 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: rank * 0.06 }}
      className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
        isBestPrice ? 'border-success shadow-success/10 shadow-sm' : 'border-gray-100'
      }`}
    >
      {isBestPrice && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full mb-3 w-fit">
          <TrendingDown size={12} /> Best Price
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-display font-bold text-secondary text-lg">
            {product.supplier?.business_name || `Supplier #${rank + 1}`}
          </h3>
          {product.supplier?.is_active && (
            <div className="flex items-center gap-1 text-xs text-concrete mt-0.5">
              <CheckCircle size={11} className="text-success" />
              Verified
            </div>
          )}
        </div>
        <button
          onClick={onPin}
          className={`p-2 rounded-xl transition-colors ${pinned ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-concrete hover:text-primary'}`}
          title={pinned ? 'Remove from comparison' : 'Pin for comparison'}
        >
          {pinned ? <X size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>

      <div className="text-3xl font-display font-bold text-primary mb-1">
        {formatCurrency(product.price)}
        <span className="text-sm text-concrete font-normal ml-1">/{product.material?.unit}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 my-3 text-xs">
        <div className="flex items-center gap-1 text-concrete">
          <MapPin size={11} />
          {product.supplier?.county || '—'}
        </div>
        <div className="flex items-center gap-1 text-concrete">
          <Star size={11} className="text-warning" />
          {product.supplier?.rating?.toFixed(1) || '—'} ({product.supplier?.total_orders || 0})
        </div>
        <StockBadge qty={product.stock_qty} />
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-concrete">
        {product.supplier?.delivery_radius_km && (
          <span className={`flex items-center gap-1 ${product.supplier.delivery_radius_km > 0 ? 'text-success' : 'text-concrete'}`}>
            <Truck size={11} />
            Delivery available
          </span>
        )}
        {product.min_order_qty > 0 && (
          <span>Min: {product.min_order_qty} {product.material?.unit}</span>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" fullWidth onClick={onQuote} icon={<MessageSquare size={13} />}>
          Request Quote
        </Button>
        <Button size="sm" fullWidth onClick={onOrder} disabled={product.stock_qty === 0}>
          Order Now
        </Button>
      </div>
    </motion.div>
  )
}

function MessageSquare(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function ComparePage() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [county, setCounty] = useState('Nairobi')
  const [maxPrice, setMaxPrice] = useState('')
  const [hasDelivery, setHasDelivery] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pinned, setPinned] = useState<string[]>([])
  const [orderModal, setOrderModal] = useState<SupplierProduct | null>(null)
  const [orderQty, setOrderQty] = useState('1')
  const [orderAddress, setOrderAddress] = useState('')
  const [alertModal, setAlertModal] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')

  const filtered = SUGGESTIONS.filter((s) => s.toLowerCase().includes(search.toLowerCase()))

  const { data, isLoading } = useQuery({
    queryKey: ['compare', submittedSearch, county, maxPrice, hasDelivery],
    queryFn: () => productsApi.compare({
      material: submittedSearch,
      county,
    }),
    enabled: !!submittedSearch,
  })

  // Backend /api/products/compare returns { material, results }
  const results: SupplierProduct[] = data?.data?.results || []

  const handleSearch = () => {
    if (!search.trim()) return
    setSubmittedSearch(search)
    setShowSuggestions(false)
  }

  const togglePin = (id: string) => {
    if (pinned.includes(id)) {
      setPinned(pinned.filter((p) => p !== id))
    } else if (pinned.length < 4) {
      setPinned([...pinned, id])
    } else {
      toast.error('You can compare up to 4 suppliers')
    }
  }

  const pinnedProducts = results.filter((r) => pinned.includes(r.id))

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Compare Prices" subtitle="Find the best prices for your construction materials" />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Search bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search for a material (e.g. OPC Cement, BRC Mesh…)"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                leftIcon={<Search size={16} />}
                fullWidth
              />
              <AnimatePresence>
                {showSuggestions && filtered.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
                  >
                    {filtered.slice(0, 6).map((s) => (
                      <button key={s} onClick={() => { setSearch(s); setShowSuggestions(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-secondary hover:bg-gray-50 hover:text-primary transition-colors">
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Select value={county}
              options={KENYA_COUNTIES.map((c) => ({ value: c, label: c }))}
              onChange={(e) => setCounty(e.target.value)} />
            <Button onClick={handleSearch} icon={<Search size={16} />}>
              Compare
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-concrete font-medium flex items-center gap-1.5">
              <Filter size={12} /> Filters:
            </span>
            <Input
              placeholder="Max price (KES)"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-36 text-sm"
            />
            <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
              <input type="checkbox" checked={hasDelivery}
                onChange={(e) => setHasDelivery(e.target.checked)} className="accent-primary" />
              <Truck size={14} className="text-concrete" />
              Delivery only
            </label>
            {submittedSearch && (
              <button onClick={() => setAlertModal(true)}
                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline ml-auto">
                <Bell size={13} /> Set price alert
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!submittedSearch && (
          <EmptyState
            icon={<Search size={28} />}
            title="Search for materials"
            description="Type a material name above to compare prices from suppliers near you"
          />
        )}

        {/* Loading */}
        {isLoading && <PageLoader />}

        {/* Results */}
        {submittedSearch && !isLoading && (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-secondary text-xl">
                  {results.length > 0 ? `${results.length} suppliers found` : 'No results'}
                </h2>
                <p className="text-concrete text-sm">
                  {submittedSearch} · {county} {maxPrice && `· max KES ${maxPrice}`}
                </p>
              </div>
              {pinned.length > 0 && (
                <Badge variant="primary">{pinned.length} pinned for comparison</Badge>
              )}
            </div>

            {/* Price history (if results exist) */}
            {results.length > 0 && (
              <Card className="mb-5">
                <CardHeader>
                  <CardTitle>Price History — {submittedSearch}</CardTitle>
                  <span className="text-xs text-concrete bg-success/10 text-success px-2 py-1 rounded-lg font-semibold">
                    ↓ Trending down 4%
                  </span>
                </CardHeader>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={PRICE_HISTORY_DEMO}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B9094' }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${v}`} domain={['auto', 'auto']} />
                    <Tooltip
                      formatter={(v: unknown) => [formatCurrency(Number(v)), 'Price/bag']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#E87722" strokeWidth={2} dot={{ fill: '#E87722', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {results.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={28} />}
                title="No suppliers found"
                description={`No suppliers have ${submittedSearch} listed in ${county}. Try a different county or material name.`}
              />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((product, i) => (
                  <SupplierResultCard
                    key={product.id}
                    product={product}
                    rank={i}
                    pinned={pinned.includes(product.id)}
                    onPin={() => togglePin(product.id)}
                    onOrder={() => { setOrderModal(product); setOrderQty(String(product.min_order_qty || 1)) }}
                    onQuote={() => toast.success('Quote request sent via SMS to supplier')}
                  />
                ))}
              </div>
            )}

            {/* Pinned comparison */}
            <AnimatePresence>
              {pinnedProducts.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-secondary text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-30"
                >
                  <span className="text-sm font-medium">{pinnedProducts.length} suppliers pinned</span>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors">
                      <Share2 size={12} /> Share
                    </button>
                    <button className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors">
                      <Download size={12} /> PDF
                    </button>
                  </div>
                  <button onClick={() => setPinned([])} className="text-white/50 hover:text-white ml-2">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Order Modal */}
      <Modal open={!!orderModal} onClose={() => setOrderModal(null)}
        title={`Order from ${orderModal?.supplier?.business_name || 'Supplier'}`} size="md">
        {orderModal && (
          <div className="p-6 flex flex-col gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-secondary">{orderModal.material?.name}</p>
                  <p className="text-xs text-concrete mt-0.5">Min order: {orderModal.min_order_qty} {orderModal.material?.unit}</p>
                </div>
                <p className="text-xl font-bold text-primary">{formatCurrency(orderModal.price)}<span className="text-sm text-concrete">/{orderModal.material?.unit}</span></p>
              </div>
            </div>

            <Input label={`Quantity (${orderModal.material?.unit}s)`} type="number"
              value={orderQty} onChange={(e) => setOrderQty(e.target.value)} fullWidth
              hint={`Total: ${formatCurrency(Number(orderQty) * orderModal.price)}`} />

            <Input label="Delivery Address" placeholder="Your site address…"
              value={orderAddress} onChange={(e) => setOrderAddress(e.target.value)} fullWidth />

            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-concrete">Subtotal</span>
                <span className="font-semibold text-secondary">{formatCurrency(Number(orderQty) * orderModal.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-concrete">Delivery fee</span>
                <span className="font-semibold text-secondary">TBD</span>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                <span className="font-bold text-secondary">Total</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(Number(orderQty) * orderModal.price)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setOrderModal(null)}>Cancel</Button>
              <Button fullWidth onClick={() => { toast.success('Order placed! You\'ll receive an SMS confirmation.'); setOrderModal(null) }}>
                Confirm Order
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Price Alert Modal */}
      <Modal open={alertModal} onClose={() => setAlertModal(false)} title="Set Price Alert" size="sm">
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-secondary">
            <Bell size={14} className="inline mr-1.5 text-primary" />
            We'll SMS you when <strong>{submittedSearch}</strong> drops below your target price in <strong>{county}</strong>.
          </div>
          <Input label="Target Price (KES/bag)" type="number" value={alertPrice}
            onChange={(e) => setAlertPrice(e.target.value)} fullWidth
            placeholder="e.g. 700" />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setAlertModal(false)}>Cancel</Button>
            <Button fullWidth onClick={() => { toast.success('Price alert set! You\'ll receive an SMS when the price drops.'); setAlertModal(false) }}
              disabled={!alertPrice} icon={<Bell size={16} />}>
              Set Alert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
