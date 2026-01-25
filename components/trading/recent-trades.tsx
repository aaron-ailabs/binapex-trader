"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { useAuth } from "@/contexts/auth-context"

interface RecentTradesProps {
  assetId: string
}

interface Trade {
  id: string
  price: number
  size: number
  side: 'buy' | 'sell'
  timestamp: string
}

export function RecentTrades({ assetId }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Fetch initial trades
    const fetchTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('asset_id', assetId)
        .order('timestamp', { ascending: false })
        .limit(20)
      
      if (data) setTrades(data)
    }

    fetchTrades()

    // Realtime subscription
    const channel = supabase
      .channel(`trade_history:${assetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          setTrades(prev => [payload.new as Trade, ...prev].slice(0, 20))
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for trade_history:${assetId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [assetId, supabase, user])

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <h3 className="text-gray-400 font-bold mb-4 text-sm uppercase tracking-wide">Recent Trades</h3>
      
      <div className="flex text-xs text-gray-500 mb-2 font-mono">
        <span className="flex-1">Price</span>
        <span className="flex-1 text-right">Size</span>
        <span className="flex-1 text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs scrollbar-hide">
        {trades.map((trade) => (
          <div key={trade.id} className="flex">
            <span className={`flex-1 ${trade.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
              {Number(trade.price).toFixed(2)}
            </span>
            <span className="flex-1 text-right text-gray-300">
              {Number(trade.size).toFixed(4)}
            </span>
            <span className="flex-1 text-right text-gray-500">
              {new Date(trade.timestamp).toLocaleTimeString([], { hour12: false })}
            </span>
          </div>
        ))}
        {trades.length === 0 && (
            <div className="text-center text-gray-600 py-4">No recent trades</div>
        )}
      </div>
    </GlassCard>
  )
}
