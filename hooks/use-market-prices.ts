"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Asset } from "@/lib/types/database"

export interface MarketPrice {
  asset_id: string
  price: number
  bid_price: number
  ask_price: number
  change_24h: number
  volume_24h: number
  timestamp: string
}

export function useMarketPrices(assets: Asset[]) {
  const [prices, setPrices] = useState<Record<string, MarketPrice>>({})
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchPrices = async () => {
      const { data, error } = await supabase
        .from("market_prices")
        .select("*")
        .in(
          "asset_id",
          assets.map((a) => a.id),
        )

      if (!error && data) {
        const priceMap: Record<string, MarketPrice> = {}
        data.forEach((p) => {
          priceMap[p.asset_id] = p
        })
        setPrices(priceMap)
      }
    }

    fetchPrices()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("market-prices")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "market_prices",
        },
        (payload) => {
          console.log("[v0] Market price update:", payload)
          if (payload.new) {
            const newPrice = payload.new as MarketPrice
            setPrices((prev) => ({
              ...prev,
              [newPrice.asset_id]: newPrice,
            }))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [assets])

  return prices
}
