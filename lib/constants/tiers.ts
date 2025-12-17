// Membership tier configuration

export interface TierConfig {
  name: string
  color: string
  minVolume: number
  maxVolume: number | null
  benefits: string[]
}

export const MEMBERSHIP_TIERS: Record<string, TierConfig> = {
  silver: {
    name: "Silver",
    color: "#C0C0C0",
    minVolume: 0,
    maxVolume: 50000,
    benefits: ["1x Bonus on deposits", "Email support", "Basic trading tools"],
  },
  gold: {
    name: "Gold",
    color: "#FFD700",
    minVolume: 50000,
    maxVolume: 200000,
    benefits: ["1.5x Bonus on deposits", "Priority email support", "Advanced charts", "50% lower fees"],
  },
  platinum: {
    name: "Platinum",
    color: "#E5E4E2",
    minVolume: 200000,
    maxVolume: 500000,
    benefits: [
      "2x Bonus on deposits",
      "24/7 priority support",
      "Pro trading tools",
      "75% lower fees",
      "Dedicated account manager",
    ],
  },
  diamond: {
    name: "Diamond",
    color: "#B9F2FF",
    minVolume: 500000,
    maxVolume: null,
    benefits: [
      "3x Bonus on deposits",
      "VIP support line",
      "Institutional tools",
      "90% lower fees",
      "Personal trading advisor",
      "Exclusive webinars",
    ],
  },
}

export function getTierProgress(currentVolume: number, currentTier: string): number {
  const tier = MEMBERSHIP_TIERS[currentTier]
  if (!tier.maxVolume) return 100 // Max tier reached

  const progress = ((currentVolume - tier.minVolume) / (tier.maxVolume - tier.minVolume)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

export function getNextTier(currentTier: string): string | null {
  const tiers = ["silver", "gold", "platinum", "diamond"]
  const currentIndex = tiers.indexOf(currentTier)
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
}
