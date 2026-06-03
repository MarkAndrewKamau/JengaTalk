import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Calculator, Download, ShoppingCart } from 'lucide-react'
import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'

const COMMON_MATERIALS = [
  { name: 'OPC Cement', unit: 'bag', avgPrice: 720 },
  { name: 'River Sand', unit: 'tonne', avgPrice: 2800 },
  { name: '3/4 Ballast', unit: 'tonne', avgPrice: 3200 },
  { name: 'BRC Wire Mesh', unit: 'sheet', avgPrice: 1850 },
  { name: 'Corrugated Sheets', unit: 'sheet', avgPrice: 890 },
  { name: 'Red Bricks', unit: 'piece', avgPrice: 15 },
  { name: 'Timber 2x4', unit: 'metre', avgPrice: 120 },
  { name: 'Roofing Nails', unit: 'kg', avgPrice: 180 },
]

interface LineItem {
  id: string
  name: string
  unit: string
  quantity: string
  price: string
}

export function CalculatorPage() {
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', name: 'OPC Cement', unit: 'bag', quantity: '50', price: '720' },
  ])
  const [projectName, setProjectName] = useState('')

  const addItem = (material?: typeof COMMON_MATERIALS[0]) => {
    setItems((prev) => [...prev, {
      id: Date.now().toString(),
      name: material?.name || '',
      unit: material?.unit || 'bag',
      quantity: '',
      price: material?.avgPrice?.toString() || '',
    }])
  }

  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    return sum + qty * price
  }, 0)

  const handleExport = () => {
    toast.success('PDF quote generated and downloaded')
  }

  const handleOrderAll = () => {
    toast.success('Quote sent to cheapest available suppliers')
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Budget Calculator" subtitle="Estimate project material costs and find the best deals" />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Calculator */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Material List</CardTitle>
                <Input placeholder="Project name (optional)" value={projectName}
                  onChange={(e) => setProjectName(e.target.value)} className="max-w-40 text-sm" />
              </CardHeader>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-concrete uppercase tracking-wide px-1">
                <div className="col-span-4">Material</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price (KES)</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {items.map((item) => {
                    const subtotal = (Number(item.quantity) || 0) * (Number(item.price) || 0)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-12 gap-2 items-center group"
                      >
                        <div className="col-span-4">
                          <input type="text" value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Material name"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="col-span-2">
                          <input type="text" value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            placeholder="0"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                            placeholder="0"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <span className="font-semibold text-secondary text-sm">
                            {subtotal > 0 ? formatCurrency(subtotal) : '—'}
                          </span>
                          <button onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-concrete hover:text-danger transition-all">
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              <button onClick={() => addItem()}
                className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-concrete hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Add Material
              </button>

              {/* Total */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-concrete">Subtotal (excluding delivery)</span>
                  <span className="text-2xl font-display font-bold text-secondary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <Button variant="outline" fullWidth onClick={handleExport} icon={<Download size={14} />}>
                  Export PDF
                </Button>
                <Button fullWidth onClick={handleOrderAll} icon={<ShoppingCart size={14} />}>
                  Find Cheapest Suppliers
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick add panel */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Add</CardTitle>
              </CardHeader>
              <p className="text-xs text-concrete mb-3">Click to add with current market average price</p>
              <div className="flex flex-col gap-2">
                {COMMON_MATERIALS.map((m) => (
                  <button key={m.name} onClick={() => addItem(m)}
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/30 rounded-xl text-sm transition-all group">
                    <span className="font-medium text-secondary group-hover:text-primary transition-colors">{m.name}</span>
                    <div className="text-right">
                      <p className="text-xs text-primary font-semibold">{formatCurrency(m.avgPrice)}</p>
                      <p className="text-xs text-concrete">per {m.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {total > 0 && (
              <Card variant="dark">
                <div className="text-center">
                  <Calculator size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-white/60 text-xs mb-1">Estimated Total</p>
                  <p className="font-display font-bold text-2xl text-white">{formatCurrency(total)}</p>
                  <p className="text-white/40 text-xs mt-1">{items.filter((i) => i.name).length} material types</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
