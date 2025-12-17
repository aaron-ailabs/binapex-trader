import type { LucideIcon } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <h3 className="text-2xl md:text-3xl font-bold font-mono text-white">{value}</h3>
          {trend && (
            <p className={cn("text-sm font-medium", trend.isPositive ? "text-emerald-500" : "text-red-500")}>
              {trend.isPositive ? "+" : ""}
              {trend.value}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F59E0B]/10">
          <Icon className="h-6 w-6 text-[#F59E0B]" />
        </div>
      </div>
    </GlassCard>
  )
}
