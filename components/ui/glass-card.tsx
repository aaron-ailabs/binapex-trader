import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-6",
        hover && "transition-all duration-300 hover:border-binapex-gold/30 hover:shadow-lg hover:shadow-binapex-gold/5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
