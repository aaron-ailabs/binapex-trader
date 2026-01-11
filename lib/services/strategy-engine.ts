import { createServiceClient } from "@/lib/supabase/service"

export class StrategyEngine {
  private supabase

  constructor() {
    this.supabase = createServiceClient()
  }

  /**
   * Main execution point for the Cron job.
   * Iterates through active auto-trade users and executes strategies.
   */
  async executeStrategies() {
    console.log("[Auto-Trade] Starting execution cycle...")
    
    // 1. Fetch Active Users
    const { data: settings, error } = await this.supabase
      .from("auto_trade_settings")
      .select("*")
      .eq("is_active", true)

    if (error) {
      console.error("[Auto-Trade] Failed to fetch settings:", error)
      return { success: false, error: error.message }
    }

    if (!settings || settings.length === 0) {
      console.log(`[Auto-Trade] No active users found.`)
      return { success: true, results: [] }
    }

    console.log(`[Auto-Trade] Found ${settings.length} active users.`)
    
    // 2. Batch Fetch Profiles (Balances)
    const userIds = settings.map(s => s.user_id)
    const { data: profiles } = await this.supabase
      .from("profiles")
      .select("id, balance_usd")
      .in("id", userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]))

    // 3. Batch Fetch Prices (Pre-fetch commonly used assets)
    // For simplicity, we fetch all relevant assets or a top list.
    // Collecting unique preferred assets
    const allPreferred = new Set<string>()
    settings.forEach(s => {
      if (s.preferred_assets) s.preferred_assets.forEach((a: string) => allPreferred.add(a))
    })
    // Fallback to BTC if empty
    if (allPreferred.size === 0) allPreferred.add("BTC-USD")

    // We need to map Symbols to Trading Pair IDs and Prices
    const distinctSymbols = Array.from(allPreferred)
    const { data: tradingPairs } = await this.supabase
      .from("trading_pairs")
      .select("id, symbol, last_price")
      .in("symbol", distinctSymbols)

    // Also fetch from assets table for fallback prices
    const assetSymbols = distinctSymbols.map(s => s.split('-')[0])
    const { data: assetData } = await this.supabase
        .from("assets")
        .select("symbol, current_price")
        .in("symbol", assetSymbols)
    
    // Build price map: Symbol -> { pairId, price }
    const marketData = new Map<string, { pairId: string, price: number }>()

    if (tradingPairs) {
        tradingPairs.forEach(tp => {
            let price = tp.last_price
            // Fallback to assets table if 0
            if (!price || price <= 0) {
                const base = tp.symbol.split('-')[0]
                const a = assetData?.find((ad: any) => ad.symbol === base)
                if (a) price = a.current_price
            }
            if (price > 0) {
                marketData.set(tp.symbol, { pairId: tp.id, price })
            }
        })
    }

    // 4. Concurrent Execution
    const promises = settings.map(setting => {
        const profile = profileMap.get(setting.user_id)
        return this.processUser(setting, profile, marketData)
    })

    const results = await Promise.allSettled(promises)
    
    // Format results
    const outcomes = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return { user_id: settings[i].user_id, success: false, error: String(r.reason) }
    })

    return { success: true, results: outcomes }
  }

  /**
   * Process a single user's strategy using pre-fetched data
   */
  private async processUser(setting: any, profile: any, marketData: Map<string, { pairId: string, price: number }>) {
    // 1. Check Balance
    if (!profile || profile.balance_usd < setting.allocation_amount) {
      return { user_id: setting.user_id, status: "skipped", reason: "insufficient_balance" }
    }

    // 2. Select Asset
    const assets = setting.preferred_assets && setting.preferred_assets.length > 0 
      ? setting.preferred_assets 
      : ["BTC-USD"]
    const symbol = assets[Math.floor(Math.random() * assets.length)]

    // 3. Strategy Signal (Mock)
    const signal = Math.random() > 0.5 ? "buy" : "skip" // 50% chance
    if (signal === "skip") {
      return { user_id: setting.user_id, status: "skipped", reason: "no_signal" }
    }

    // 4. Get Price Data
    const market = marketData.get(symbol)
    if (!market) {
        return { user_id: setting.user_id, status: "failed", reason: `no_market_data_${symbol}` }
    }

    const { pairId, price } = market
    if (price <= 0) {
         return { user_id: setting.user_id, status: "failed", reason: `invalid_price_${symbol}` }
    }

    // 5. Execute Trade
    const amount = setting.allocation_amount
    const quantity = amount / price

    const { data: rpcResult, error: rpcError } = await this.supabase.rpc("place_order_atomic", {
      p_user_id: setting.user_id,
      p_trading_pair_id: pairId,
      p_side: "buy",
      p_price: price,
      p_amount: quantity,
      p_type: "limit"
    })

    if (rpcError || !rpcResult.success) {
      await this.logAction(setting.user_id, "buy", symbol, quantity, price, "failed", rpcError?.message || rpcResult?.error)
      return { user_id: setting.user_id, status: "failed", error: rpcError?.message || rpcResult?.error }
    }

    // 6. Log Success
    await this.logAction(setting.user_id, "buy", symbol, quantity, price, "success", { order_id: rpcResult.order_id })
    return { user_id: setting.user_id, status: "success", order_id: rpcResult.order_id }
  }

  private async logAction(userId: string, action: string, symbol: string, amount: number, price: number, result: string, details: any) {
    await this.supabase.from("auto_trade_logs").insert({
      user_id: userId,
      action,
      symbol,
      amount,
      price,
      result,
      details
    })
  }
}
