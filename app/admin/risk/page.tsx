import { AdminRoute } from "@/components/admin/admin-route"
import { AdminLayout } from "@/components/layout/admin-layout"
import { createClient } from "@/lib/supabase/server"
import { RiskMonitor } from "@/components/admin/risk-monitor"

export default async function AdminRiskPage() {
  const supabase = await createClient()

  const { data: openTrades } = await supabase
    .from("trades")
    .select("*, profiles(full_name, email, risk_mode), assets(symbol, name, current_price)")
    .eq("status", "open")
    .order("created_at", { ascending: false })

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Risk Monitor</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage all open positions</p>
          </div>
          <RiskMonitor openTrades={openTrades || []} />
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
