import { DashboardHeader } from '../../components/layout/DashboardHeader'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Save } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashboardHeader title="Settings" subtitle="Manage your supplier account settings" />
      <div className="flex-1 p-6 overflow-y-auto max-w-2xl">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader><CardTitle>Business Profile</CardTitle></CardHeader>
            <div className="grid gap-4">
              <Input label="Business Name" defaultValue="BuildMart Kenya" fullWidth />
              <Input label="Contact Phone" defaultValue="+254712345678" fullWidth />
              <Select label="County" value="Nairobi"
                options={[{ value: 'Nairobi', label: 'Nairobi' }]} fullWidth />
              <Input label="Town / Area" defaultValue="Westlands" fullWidth />
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <div className="flex flex-col gap-3">
              {[
                'New order received', 'Order confirmed', 'Stock running low', 'Payment received',
              ].map((pref) => (
                <label key={pref} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-secondary">{pref}</span>
                  <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                </label>
              ))}
            </div>
          </Card>
          <Button icon={<Save size={16} />}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
