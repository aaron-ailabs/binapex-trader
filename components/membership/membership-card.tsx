import { GlassCard } from "@/components/ui/glass-card"
import { Crown, Lock, Check } from "lucide-react"
import type { TierConfig } from "@/lib/constants/tiers"
import { cn } from "@/lib/utils"

interface MembershipCardProps {
  tier: TierConfig
  isCurrentTier: boolean
  isUnlocked: boolean
}

export function MembershipCard({ tier, isCurrentTier, isUnlocked }: MembershipCardProps) {
  return (
    <GlassCard
      className={cn("p-6 relative transition-all", isCurrentTier && "border-2", !isUnlocked && "opacity-60")}
      style={{
        borderColor: isCurrentTier ? tier.color : undefined,
      }}
    >
      {isCurrentTier && (
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
        >
          CURRENT
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tier.color}20` }}
        >
          {isUnlocked ? (
            <Crown className="h-5 w-5" style={{ color: tier.color }} />
          ) : (
            <Lock className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <h3 className="text-xl font-bold" style={{ color: tier.color }}>
          {tier.name}
        </h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="text-sm text-gray-400">
          <span className="font-mono text-white">${tier.minVolume.toLocaleString()}</span>
          {tier.maxVolume && <span> - ${tier.maxVolume.toLocaleString()}</span>}
          {!tier.maxVolume && <span>+</span>}
        </div>
      </div>

      <ul className="space-y-2">
        {tier.benefits.slice(0, 3).map((benefit, index) => (
          <li key={index} className="flex items-start gap-2 text-xs text-gray-300">
            <Check className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
