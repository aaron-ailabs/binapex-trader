"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

export interface PortfolioData {
  balance_usd: number
  holdings: Record<string, number>
  isLoading: boolean
}

export function useUserPortfolio() {
  const { user } = useAuth()
  const [data, setData] = useState<PortfolioData>({
    balance_usd: 0,
    holdings: {},
    isLoading: true,
  })
  const supabase = useMemo(() => createClient(), [])

  const fetchPortfolio = useCallback(async () => {
    try {
      if (!user) {
        setData(prev => ({ ...prev, isLoading: false }))
        return
      }

      const { data: wallets } = await supabase
        .from('wallets')
        .select('asset, balance, locked_balance')
        .eq('user_id', user.id)

      let usdBal = 0
      const holdingsMap: Record<string, number> = {}

      if (wallets) {
        wallets.forEach(w => {
          if (w.asset === 'USD' || w.asset === 'USDT') {
            usdBal += Number(w.balance) - Number(w.locked_balance || 0)
          } else {
            holdingsMap[w.asset] = Number(w.balance)
          }
        })
      }

      setData({
        balance_usd: usdBal,
        holdings: holdingsMap,
        isLoading: false
      })
    } catch (error) {
      console.error("Error fetching portfolio:", error)
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }, [user, supabase])

  useEffect(() => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false }))
      return
    }
    fetchPortfolio()

    // Subscribe to balance changes for this specific user
    const channel = supabase
      .channel(`portfolio:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchPortfolio()
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for portfolio:${user.id}`)
        }
      })

    // Listen for custom wallet_update event
    const handleUpdate = () => fetchPortfolio()
    window.addEventListener('wallet_update', handleUpdate)

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
      window.removeEventListener('wallet_update', handleUpdate)
    }
  }, [user, fetchPortfolio, supabase])

  return { ...data, refetch: fetchPortfolio }
}
