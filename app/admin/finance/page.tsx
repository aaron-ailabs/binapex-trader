import { AdminRoute } from "@/components/admin/admin-route"
import { AdminLayout } from "@/components/layout/admin-layout"
import { createClient } from "@/lib/supabase/server"
import { DepositApprovalList } from "@/components/admin/deposit-approval-list"
import { ExchangeRateManager } from "@/components/admin/exchange-rate-manager"
import { getExchangeRate } from "@/app/actions/exchange-rate"

export default async function AdminFinancePage() {
  const supabase = await createClient()

  const { data: pendingDeposits } = await supabase
    .from("transactions")
    .select("*")
    .eq("type", "deposit")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const exchangeData = await getExchangeRate()

  // Fetch user profiles for all depositing users
  const userIds = pendingDeposits?.map((d: any) => d.user_id) || []
  const { data: profiles } =
    userIds.length > 0 ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds) : { data: [] }

  // Combine deposit and profile data
  const depositsWithProfiles =
    pendingDeposits?.map((deposit: any) => {
      const profile = profiles?.find((p: any) => p.id === deposit.user_id)
      return {
        ...deposit,
        full_name: profile?.full_name || "Unknown",
        email: profile?.email || "Unknown",
      }
    }) || []

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Finance Operations</h1>
            <p className="text-gray-400 mt-1">Review and approve deposit requests</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
             <div className="md:col-span-2 space-y-6">
                <DepositApprovalList deposits={depositsWithProfiles} />
             </div>
             <div>
                <ExchangeRateManager initialRate={exchangeData.rate} lastUpdated={exchangeData.lastUpdated} />
             </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
