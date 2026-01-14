import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch USD Wallet Balance (Source of Truth)
  const { data: usdWallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .eq("asset", "USD")
    .single()

  const { data: assets } = await supabase.from("assets").select("*").eq("is_active", true).limit(8)

  // Use Wallet Balance if available, fallback to profile (legacy)
  const displayBalance = usdWallet?.balance ?? profile?.balance_usd ?? 0

  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", user.id)
    .gt("amount", 0)

  // Calculate 24h P/L based on Portfolio
  let totalPortfolioValue = 0
  let totalInvestedValue = 0

  portfolio?.forEach(item => {
    const asset = assets?.find(a => a.symbol === item.symbol)
    if (asset) {
      const currentVal = item.amount * asset.current_price
      const investedVal = item.amount * item.average_buy_price
      totalPortfolioValue += currentVal
      totalInvestedValue += investedVal
    }
  })

  // Adjusted P/L logic
  const totalPnL = totalPortfolioValue - totalInvestedValue

  const pnlPercent = totalInvestedValue > 0 ? ((totalPnL / totalInvestedValue) * 100).toFixed(2) : "0.00"

  return (
    <DashboardLayout>
      <DashboardClient
        initialProfile={profile}
        initialBalance={displayBalance}
        initialAssets={assets || []}
        initialPortfolio={portfolio || []}
        userEmail={user.email || ""}
      />
    </DashboardLayout>
  )
}
