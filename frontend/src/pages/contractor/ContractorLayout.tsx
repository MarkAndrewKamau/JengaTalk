import { Outlet } from 'react-router-dom'
import { ContractorSidebar } from '../../components/layout/ContractorSidebar'

export function ContractorLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ContractorSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
