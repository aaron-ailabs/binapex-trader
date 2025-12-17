import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/io/mod.ts"

const LIQUIDATION_THRESHOLD = 0.8 // 80% margin depletion

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("[v0] Starting liquidation check...")

    // Fetch all open positions with current market prices
    const { data: positions, error: positionsError } = await supabase
      .from("trades")
      .select(
        `
        id,
        user_id,
        asset_id,
        type,
        entry_price,
        size,
        leverage,
        margin_used,
        assets!inner(symbol),
        market_prices!inner(price)
      `,
      )
      .eq("status", "open")

    if (positionsError) throw positionsError

    const liquidations = []

    for (const position of positions) {
      const currentPrice = position.market_prices.price
      const entryPrice = position.entry_price

      // Calculate P&L
      let pnl = 0
      if (position.type === "buy") {
        pnl = (currentPrice - entryPrice) * position.size
      } else {
        pnl = (entryPrice - currentPrice) * position.size
      }

      // Calculate margin depletion percentage
      const marginLoss = Math.abs(Math.min(pnl, 0))
      const marginDepletionPercent = marginLoss / position.margin_used

      console.log(
        `[v0] Position ${position.id}: ${position.assets.symbol} ${position.type} | Entry: ${entryPrice} | Current: ${currentPrice} | P&L: ${pnl.toFixed(2)} | Margin Depletion: ${(marginDepletionPercent * 100).toFixed(2)}%`,
      )

      // Liquidate if loss >= 80% of margin
      if (marginDepletionPercent >= LIQUIDATION_THRESHOLD) {
        console.log(`[v0] LIQUIDATING position ${position.id}`)

        // Update position to liquidated
        const { error: updateError } = await supabase
          .from("trades")
          .update({
            status: "liquidated",
            exit_price: currentPrice,
            profit_loss: pnl,
            closed_at: new Date().toISOString(),
          })
          .eq("id", position.id)

        if (updateError) {
          console.error(`[v0] Error liquidating position ${position.id}:`, updateError)
        } else {
          liquidations.push({
            position_id: position.id,
            user_id: position.user_id,
            symbol: position.assets.symbol,
            pnl: pnl.toFixed(2),
          })

          // Create transaction record for liquidation
          await supabase.from("transactions").insert({
            user_id: position.user_id,
            type: "trade_loss",
            amount: pnl,
            currency: "USD",
            status: "completed",
            payment_method: "liquidation",
          })
        }
      }
    }

    console.log(`[v0] Liquidation check complete. Liquidated: ${liquidations.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        checked: positions.length,
        liquidated: liquidations.length,
        liquidations,
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[v0] Liquidation check error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
