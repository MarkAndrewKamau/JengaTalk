import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Grid, List, Edit2, Trash2, AlertTriangle,
  Package, ToggleLeft, ToggleRight, TrendingUp
} from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/Spinner'
import { productsApi } from '../../api/products'
import { formatCurrency } from '../../utils/format'
import { CATEGORY_LABELS, type SupplierProduct, type MaterialCategory } from '../../types'
import toast from 'react-hot-toast'

const UNITS = ['bag', 'tonne', 'metre', 'sheet', 'piece', 'litre', 'roll']
const CATEGORIES: { value: MaterialCategory; label: string }[] = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value: value as MaterialCategory, label }))

const CATEGORY_ICONS: Record<MaterialCategory, string> = {
  cement_aggregates: '🏗️',
  steel_iron: '⚙️',
  timber_wood: '🌲',
  roofing: '🏠',
  plumbing: '🔧',
  electrical: '⚡',
  finishing: '🎨',
}

function StockIndicator({ qty, min = 10 }: { qty: number; min?: number }) {
  const pct = Math.min((qty / (min * 10)) * 100, 100)
  const color = qty === 0 ? 'bg-danger' : qty < min ? 'bg-warning' : 'bg-success'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-concrete">Stock</span>
        <span className={`font-semibold ${qty === 0 ? 'text-danger' : qty < min ? 'text-warning' : 'text-success'}`}>
          {qty}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface ProductFormData {
  category: MaterialCategory
  name: string
  unit: string
  price: string
  stock_qty: string
  min_order_qty: string
  description: string
}

const defaultForm: ProductFormData = {
  category: 'cement_aggregates', name: '', unit: 'bag',
  price: '', stock_qty: '', min_order_qty: '1', description: ''
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<SupplierProduct | null>(null)
  const [form, setForm] = useState<ProductFormData>(defaultForm)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkType, setBulkType] = useState<'amount' | 'percent'>('percent')

  const { data, isLoading } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => productsApi.browse(),
  })

  const addMutation = useMutation({
    mutationFn: productsApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      setShowAddModal(false)
      setForm(defaultForm)
      toast.success('Product added successfully')
    },
    onError: () => toast.error('Failed to add product'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierProduct> }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      setEditProduct(null)
      toast.success('Product updated')
    },
    onError: () => toast.error('Failed to update product'),
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      toast.success('Product removed')
    },
  })

  const bulkMutation = useMutation({
    mutationFn: ({ ids, type, value }: { ids: string[]; type: 'amount' | 'percent'; value: number }) =>
      productsApi.bulkUpdatePrice(ids, type, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      setBulkModal(false)
      setSelectedIds([])
      toast.success('Prices updated')
    },
  })

  const products: SupplierProduct[] = data?.data?.data?.data || []

  const filtered = products.filter((p) => {
    const matchSearch = p.material?.name?.toLowerCase().includes(search.toLowerCase()) || !search
    const matchCat = categoryFilter === 'all' || p.material?.category === categoryFilter
    return matchSearch && matchCat
  })

  const lowStock = products.filter((p) => p.stock_qty < 10 && p.is_active)

  const handleSubmit = () => {
    const payload = {
      ...form,
      price: Number(form.price),
      stock_qty: Number(form.stock_qty),
      min_order_qty: Number(form.min_order_qty),
    }
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, data: payload })
    } else {
      addMutation.mutate(payload)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="My Products" subtitle="Manage your material listings and prices" />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Low stock alert */}
        <AnimatePresence>
          {lowStock.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-5 flex items-center gap-3"
            >
              <AlertTriangle size={18} className="text-warning shrink-0" />
              <p className="text-sm text-secondary">
                <strong>{lowStock.length} product(s)</strong> are running low on stock.
                Update stock levels to keep listings active.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
              fullWidth
            />
          </div>
          <Select
            value={categoryFilter}
            options={[{ value: 'all', label: 'All Categories' }, ...CATEGORIES]}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {(['grid', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`p-2 rounded-lg transition-colors ${view === v ? 'bg-primary/10 text-primary' : 'text-concrete hover:text-secondary'}`}>
                {v === 'grid' ? <Grid size={16} /> : <List size={16} />}
              </button>
            ))}
          </div>
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setBulkModal(true)} icon={<TrendingUp size={14} />}>
              Bulk Update ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => { setShowAddModal(true); setForm(defaultForm); setEditProduct(null) }}
            icon={<Plus size={16} />}>
            Add Product
          </Button>
        </div>

        {/* Products */}
        {isLoading ? <PageLoader /> : filtered.length === 0 ? (
          <div className="text-center py-16 text-concrete">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg">No products found</p>
            <p className="text-sm mt-1">Add your first product to start receiving orders</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)} icon={<Plus size={16} />}>Add Product</Button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
                  selectedIds.includes(product.id) ? 'border-primary' : 'border-gray-100'
                }`}
                onClick={() => toggleSelect(product.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{CATEGORY_ICONS[product.material?.category || 'cement_aggregates']}</div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={product.is_active ? 'success' : 'concrete'}>
                      {product.is_active ? 'Active' : 'Paused'}
                    </Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: product.id, data: { is_active: !product.is_active } }) }}
                      className="text-concrete hover:text-primary transition-colors"
                    >
                      {product.is_active ? <ToggleRight size={18} className="text-success" /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>

                <h3 className="font-display font-bold text-secondary mb-0.5">{product.material?.name || '—'}</h3>
                <p className="text-xs text-concrete mb-3">{CATEGORY_LABELS[product.material?.category || 'cement_aggregates']}</p>

                <div className="text-lg font-bold text-primary mb-1">
                  {formatCurrency(product.price)}<span className="text-sm text-concrete font-normal">/{product.material?.unit}</span>
                </div>

                <StockIndicator qty={product.stock_qty} min={product.min_order_qty || 10} />

                {product.times_queried_week !== undefined && (
                  <p className="text-xs text-concrete mt-2 flex items-center gap-1">
                    <TrendingUp size={11} /> {product.times_queried_week} queries this week
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditProduct(product); setForm({
                      category: product.material?.category || 'cement_aggregates',
                      name: product.material?.name || '',
                      unit: product.material?.unit || 'bag',
                      price: String(product.price),
                      stock_qty: String(product.stock_qty),
                      min_order_qty: String(product.min_order_qty),
                      description: product.material?.description || '',
                    }); setShowAddModal(true) }}
                    className="flex-1 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Remove this product?')) deleteMutation.mutate(product.id) }}
                    className="p-1.5 text-concrete hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card padding="none">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['', 'Product', 'Category', 'Price', 'Stock', 'Queries/Week', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-concrete uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)} className="accent-primary" />
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-secondary">{p.material?.name}</td>
                    <td className="py-3 px-4 text-xs text-concrete">{CATEGORY_LABELS[p.material?.category || 'cement_aggregates']}</td>
                    <td className="py-3 px-4 text-sm font-bold text-primary">{formatCurrency(p.price)}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={p.stock_qty < 10 ? 'text-danger font-semibold' : 'text-secondary'}>{p.stock_qty}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-concrete">{p.times_queried_week ?? '—'}</td>
                    <td className="py-3 px-4"><Badge variant={p.is_active ? 'success' : 'concrete'}>{p.is_active ? 'Active' : 'Paused'}</Badge></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditProduct(p); setShowAddModal(true) }}
                          className="text-primary hover:text-primary-dark transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteMutation.mutate(p.id)}
                          className="text-concrete hover:text-danger transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setEditProduct(null) }}
        title={editProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category}
              options={CATEGORIES}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MaterialCategory }))} fullWidth />
            <Input label="Material Name" placeholder="OPC Cement" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <Select label="Unit" value={form.unit}
              options={UNITS.map((u) => ({ value: u, label: u }))}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} fullWidth />
            <Input label="Price (KES)" type="number" placeholder="720" value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} fullWidth />
            <Input label="Stock Quantity" type="number" value={form.stock_qty}
              onChange={(e) => setForm((f) => ({ ...f, stock_qty: e.target.value }))} fullWidth />
            <Input label="Min Order Quantity" type="number" value={form.min_order_qty}
              onChange={(e) => setForm((f) => ({ ...f, min_order_qty: e.target.value }))} fullWidth />
          </div>
          <Input label="Description (optional)" placeholder="Additional details…" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} fullWidth />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleSubmit}
              loading={addMutation.isPending || updateMutation.isPending}>
              {editProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk price update modal */}
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Price Update" size="sm">
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-concrete">Updating {selectedIds.length} selected product(s)</p>
          <Select label="Update Type" value={bulkType}
            options={[{ value: 'percent', label: 'By percentage (%)' }, { value: 'amount', label: 'By fixed amount (KES)' }]}
            onChange={(e) => setBulkType(e.target.value as 'amount' | 'percent')} fullWidth />
          <Input label={bulkType === 'percent' ? 'Percentage change (e.g. +5 or -10)' : 'Amount (KES)'}
            type="number" value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)} fullWidth />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setBulkModal(false)}>Cancel</Button>
            <Button fullWidth loading={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ ids: selectedIds, type: bulkType, value: Number(bulkValue) })}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
