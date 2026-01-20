import type { LucideIcon } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className={cn("p-6 hover:border-primary/40 transition-colors group relative overflow-hidden", className)}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -translate-y-12 translate-x-12 group-hover:bg-primary/10 transition-colors" />

        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">{value}</h3>
            {trend && (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  trend.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}
                </span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">vs last 24h</span>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/10 transition-all duration-300">
            <Icon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
