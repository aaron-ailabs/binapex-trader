import { Skeleton } from "@/components/ui/skeleton"
import { GlassCard } from "@/components/ui/glass-card"

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-10 w-32 bg-white/5" />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-4 bg-white/5" />
            <Skeleton className="h-8 w-32 mb-2 bg-white/5" />
            <Skeleton className="h-3 w-16 bg-white/5" />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5" />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

export function DashboardSkeleton() {
  return <PageSkeleton />
}

export function TradingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
      <div className="lg:col-span-3">
        <GlassCard className="p-4">
          <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/5" />
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="lg:col-span-6">
        <GlassCard className="p-4">
          <Skeleton className="h-[400px] w-full bg-white/5" />
        </GlassCard>
      </div>

      <div className="lg:col-span-3">
        <GlassCard className="p-4">
          <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/5" />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
