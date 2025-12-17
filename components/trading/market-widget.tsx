
"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"

interface MarketWidgetProps {
  title: string
  data: Record<string, any>
  onSelect: (symbol: string, type: string) => void
  selectedSymbol?: string
}

export function MarketWidget({ title, data, onSelect, selectedSymbol }: MarketWidgetProps) {
  return (
    <GlassCard className="p-4 flex flex-col h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#F59E0B] uppercase tracking-wide text-sm">{title}</h3>
        <Badge variant="outline" className="text-xs border-white/10 text-gray-400">
          {Object.keys(data).length} Assets
        </Badge>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {Object.entries(data).map(([name, info]) => (
          <div
            key={name}
            onClick={() => onSelect(info.symbol, title)}
            className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors text-xs ${
              selectedSymbol === info.symbol
                ? "bg-[#F59E0B]/20 border border-[#F59E0B]/30"
                : "hover:bg-white/5 border border-transparent"
            }`}
          >
            <div>
              <div className="font-bold text-white">{name}</div>
              <div className="text-gray-500 text-[10px]">{info.symbol}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-white">
                {info.price ? `$${info.price.toFixed(2)}` : info.rate ? info.rate.toFixed(4) : "N/A"}
              </div>
              <div
                className={`font-mono text-[10px] ${
                  (info.change_pct || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {(info.change_pct || 0) > 0 ? "+" : ""}
                {((info.change_pct || 0) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
