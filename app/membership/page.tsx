import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { MembershipCard } from "@/components/membership/membership-card"
import { GlassCard } from "@/components/ui/glass-card"
import { MEMBERSHIP_TIERS, getTierProgress, getNextTier } from "@/lib/constants/tiers"
import { Crown, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default async function MembershipPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const currentTier = profile?.membership_tier || "silver"
  const tierConfig = MEMBERSHIP_TIERS[currentTier]
  const progress = getTierProgress(profile?.total_trade_volume || 0, currentTier)
  const nextTierName = getNextTier(currentTier)
  const nextTierConfig = nextTierName ? MEMBERSHIP_TIERS[nextTierName] : null

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Membership & Rewards</h1>
          <p className="text-gray-400">Track your tier progress and unlock exclusive benefits</p>
        </div>

        {/* Current Status */}
        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F59E0B]/10">
                <Crown className="h-6 w-6" style={{ color: tierConfig.color }} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Tier</p>
                <h3 className="text-2xl font-bold" style={{ color: tierConfig.color }}>
                  {tierConfig.name}
                </h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Trade Volume</span>
                <span className="text-white font-mono">${profile?.total_trade_volume.toFixed(2) || "0.00"}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F59E0B]/10">
                <Crown className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Bonus Balance</p>
                <h3 className="text-2xl font-bold text-[#F59E0B]">${profile?.bonus_balance.toFixed(2) || "0.00"}</h3>
              </div>
            </div>
            <p className="text-xs text-gray-500">Use bonuses for trading, not withdrawable</p>
          </GlassCard>

          <GlassCard className="p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Deposits</p>
                <h3 className="text-2xl font-bold text-white">${profile?.balance_usd.toFixed(2) || "0.00"}</h3>
              </div>
            </div>
            <p className="text-xs text-gray-500">Lifetime deposit amount</p>
          </GlassCard>
        </div>

        {/* Progress to Next Tier */}
        {nextTierConfig && (
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Progress to {nextTierConfig.name}</h3>
                  <p className="text-sm text-gray-400">
                    $
                    {tierConfig.maxVolume
                      ? (tierConfig.maxVolume - (profile?.total_trade_volume || 0)).toFixed(2)
                      : "0.00"}{" "}
                    more volume needed
                  </p>
                </div>
                <span className="text-2xl font-bold font-mono text-[#F59E0B]">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>${tierConfig.minVolume.toLocaleString()}</span>
                <span>${tierConfig.maxVolume?.toLocaleString() || "∞"}</span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Current Tier Benefits */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold mb-4">Your {tierConfig.name} Benefits</h3>
          <ul className="grid gap-3 md:grid-cols-2">
            {tierConfig.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Crown className="h-4 w-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{benefit}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* All Tiers */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">All Membership Tiers</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(MEMBERSHIP_TIERS).map(([key, tier]) => (
              <MembershipCard
                key={key}
                tier={tier}
                isCurrentTier={key === currentTier}
                isUnlocked={tier.minVolume <= (profile?.total_trade_volume || 0)}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
