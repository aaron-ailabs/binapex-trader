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

  // Fetch USD Wallet Balance (Single Source of Truth)
  const { data: usdWallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .eq("asset", "USD")
    .single()

  // STRICT: Use ONLY wallet balance from backend
  const displayBalance = usdWallet?.balance ?? 0

  const { data: assets } = await supabase.from("assets").select("*").eq("is_active", true).limit(8)

  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", user.id)
    .gt("amount", 0)

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
