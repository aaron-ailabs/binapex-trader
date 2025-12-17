import { AdminRoute } from "@/components/admin/admin-route"
import { AdminLayout } from "@/components/layout/admin-layout"
import { WithdrawalApprovalList } from "@/components/admin/withdrawal-approval-list"

export default function AdminWithdrawalsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <WithdrawalApprovalList />
      </AdminLayout>
    </AdminRoute>
  )
}
