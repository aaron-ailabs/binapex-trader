
"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

interface MarketWidgetProps {
  title: string
  data: Record<string, any>
  onSelect: (symbol: string, type: string) => void
  selectedSymbol?: string
}

export function MarketWidget({ title, data, onSelect, selectedSymbol }: MarketWidgetProps) {
  const [search, setSearch] = useState("")
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('binapex_favorites')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Persistence
  useEffect(() => {
    localStorage.setItem('binapex_favorites', JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation()
    setFavorites(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    )
  }

  // Filter Data
  const filteredData = Object.entries(data).filter(([name, info]) => {
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      info.symbol.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  // Sort: Favorites first
  const sortedData = filteredData.sort(([nameA, infoA], [nameB, infoB]) => {
    const favA = favorites.includes(infoA.symbol)
    const favB = favorites.includes(infoB.symbol)
    if (favA && !favB) return -1
    if (!favA && favB) return 1
    return 0
  })

  return (
    <GlassCard className="p-4 flex flex-col h-[300px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-[#F59E0B] uppercase tracking-wide text-sm">{title}</h3>
        <Badge variant="outline" className="text-xs border-white/10 text-gray-400">
          {Object.keys(data).length}
        </Badge>
      </div>

      {/* Search Input */}
      <div className="mb-3 relative">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {sortedData.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-4">No assets found</div>
        ) : (
          sortedData.map(([name, info]) => {
            const isFav = favorites.includes(info.symbol)
            return (
              <div
                key={name}
                onClick={() => onSelect(info.symbol, title)}
                className={`group flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors text-xs ${selectedSymbol === info.symbol
                  ? "bg-[#F59E0B]/20 border border-[#F59E0B]/30"
                  : "hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="flex gap-2 items-center">
                  <button
                    onClick={(e) => toggleFavorite(e, info.symbol)}
                    className={`text-[10px] ${isFav ? 'text-amber-500' : 'text-gray-600 group-hover:text-gray-400'}`}
                  >
                    ★
                  </button>
                  <div>
                    <div className="font-bold text-white">{name}</div>
                    <div className="text-gray-500 text-[10px]">{info.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-white">
                    {info.price ? `$${info.price.toFixed(2)}` : info.rate ? info.rate.toFixed(4) : "N/A"}
                  </div>
                  <div
                    className={`font-mono text-[10px] ${(info.change_pct || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                  >
                    {(info.change_pct || 0) > 0 ? "+" : ""}
                    {((info.change_pct || 0) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </GlassCard>
  )
}
