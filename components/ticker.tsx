"use client"

import { MOCK_TICKER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function Ticker() {
  return (
    <div className="relative w-full overflow-hidden bg-binapex-card/50 border-y border-white/5 py-3">
      <div
        className="flex gap-8"
        style={{
          animation: "scroll 30s linear infinite",
        }}
      >
        {MOCK_TICKER.map((asset, index) => {
          const isPositive = asset.change24h >= 0
          return (
            <div key={`${asset.symbol}-${index}`} className="flex items-center gap-3 whitespace-nowrap">
              <span className="font-mono text-sm font-semibold text-muted-foreground">{asset.symbol}</span>
              <span className="font-mono text-sm font-semibold text-foreground">
                ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={cn("font-mono text-xs font-medium", isPositive ? "text-success" : "text-destructive")}>
                {isPositive ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
