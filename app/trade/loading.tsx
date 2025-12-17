import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TradingSkeleton } from "@/components/ui/page-skeleton"

export default function TradeLoading() {
  return (
    <DashboardLayout>
      <TradingSkeleton />
    </DashboardLayout>
  )
}
