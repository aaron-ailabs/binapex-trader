"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface PriceSummaryProps {
  assetId: string
  symbol: string
}

export function PriceSummary({ assetId, symbol }: PriceSummaryProps) {
  const [ticker, setTicker] = useState<any>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Initial fetch
    const fetchTicker = async () => {
      const { data, error } = await supabase
        .from('tickers')
        .select('*')
        .eq('asset_id', assetId)
        .single()
      
      if (data) setTicker(data)
    }

    fetchTicker()

    // Realtime subscription
    const channel = supabase
      .channel(`ticker_updates:${assetId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickers',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          setTicker(payload.new)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for ticker_updates:${assetId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [assetId, supabase])

  if (!ticker) return <div className="h-12 animate-pulse bg-white/5 rounded-lg" />

  const isPositive = ticker.change_24h >= 0

  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="text-3xl font-mono font-bold text-white">
          ${Number(ticker.price).toFixed(2)}
        </div>
        <div className={`text-sm font-mono flex items-center gap-2 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          <span>{ticker.change_24h > 0 ? '+' : ''}{Number(ticker.change_24h).toFixed(2)}%</span>
        </div>
      </div>
      
      <div className="hidden sm:block text-xs space-y-1 text-gray-400 font-mono">
        <div className="flex gap-4">
          <span>High: <span className="text-white">{Number(ticker.high_24h).toFixed(2)}</span></span>
          <span>Vol: <span className="text-white">{Number(ticker.volume_24h).toLocaleString()}</span></span>
        </div>
        <div className="flex gap-4">
          <span>Low: <span className="text-white">{Number(ticker.low_24h).toFixed(2)}</span></span>
        </div>
      </div>
    </div>
  )
}
