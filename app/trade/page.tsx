import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TradingInterface } from "@/components/trading/trading-interface"

export default async function TradePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: tradingPairs } = await supabase
    .from("trading_pairs")
    .select("*")
    .eq("is_active", true)
    .order("asset_type, symbol")

  return (
    <DashboardLayout>
      <TradingInterface />
    </DashboardLayout>
  )
}
