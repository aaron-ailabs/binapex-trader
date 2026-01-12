"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface PortfolioData {
  balance_usd: number
  holdings: Record<string, number>
  isLoading: boolean
}

export function useUserPortfolio() {
  const [data, setData] = useState<PortfolioData>({
    balance_usd: 0,
    holdings: {},
    isLoading: true,
  })
  const supabase = createClient()

  const fetchPortfolio = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
  }

  useEffect(() => {
    fetchPortfolio()

    // Subscribe to balance changes
    const channel = supabase
      .channel('portfolio_balance')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'wallets' 
      }, () => {
        fetchPortfolio()
      })
      .subscribe()

    // Listen for custom wallet_update event
    const handleUpdate = () => fetchPortfolio()
    window.addEventListener('wallet_update', handleUpdate)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('wallet_update', handleUpdate)
    }
  }, [])

  return { ...data, refetch: fetchPortfolio }
}
