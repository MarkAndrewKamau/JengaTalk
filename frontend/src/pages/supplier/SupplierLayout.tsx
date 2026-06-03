import { Outlet } from 'react-router-dom'
import { SupplierSidebar } from '../../components/layout/SupplierSidebar'

export function SupplierLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SupplierSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
