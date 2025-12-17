import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardSkeleton } from "@/components/ui/page-skeleton"

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <DashboardSkeleton />
    </DashboardLayout>
  )
}
