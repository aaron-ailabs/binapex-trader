import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { HistoryTabs } from "@/components/history/history-tabs"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Fetch transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch trades with asset info
  const { data: trades } = await supabase
    .from("trades")
    .select("*, asset:assets(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-gray-400">View all your trading activities and financial transactions</p>
        </div>

        <HistoryTabs transactions={transactions || []} trades={trades || []} />
      </div>
    </DashboardLayout>
  )
}
