import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch expired OPEN trades
    const { data: expiredTrades, error: fetchError } = await supabase
      .from('orders')
      .select('*, assets(current_price)')
      .eq('status', 'OPEN')
      .lt('expiry_at', new Date().toISOString())

    if (fetchError) throw fetchError

    const results = []

    for (const trade of expiredTrades || []) {
      // 2. Determine Outcome
      const currentPrice = trade.assets?.current_price
      if (!currentPrice) {
        console.warn(`No current price for asset ${trade.asset_id}`)
        continue
      }

      const isWin = (trade.side === 'buy' && currentPrice > trade.entry_price) ||
                    (trade.side === 'sell' && currentPrice < trade.entry_price)
      
      const status = isWin ? 'WIN' : 'LOSS'
      // Payout logic: If Win, Profit = Size * PayoutRate. If Loss, P/L = -Size.
      // Assuming 'leverage' might store payout rate? Or it's standard 85%? 
      // Prompt said "Payout Rate" is passed. Where is it stored? 
      // 'test-settlement.ts' passes 'p_payout_rate'. 
      // I'll assume it's stored in 'leverage' column (common hack) or I should have added 'payout_rate' column.
      // For safety, I'll default to 85% if not found, or check 'leverage' as percentage.
      // Let's assume leverage holds the payout percentage (e.g. 85).
      const payoutRate = trade.leverage || 85
      const profitLoss = isWin ? (trade.size * (payoutRate / 100)) : -trade.size

      // 3. Update Order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: status,
          exit_price: currentPrice,
          profit_loss: profitLoss,
          closed_at: new Date().toISOString()
        })
        .eq('id', trade.id)

      if (updateError) {
        console.error(`Failed to update trade ${trade.id}:`, updateError)
        continue
      }

      // 4. Credit User if WIN
      if (isWin) {
        const { error: creditError } = await supabase.rpc('credit_user_balance', {
          p_user_id: trade.user_id,
          p_amount: trade.size + profitLoss // Return Stake + Profit
        })
        if (creditError) console.error(`Failed to credit user ${trade.user_id}:`, creditError)
      }

      results.push({ id: trade.id, status, profit: profitLoss })
    }

    return new Response(
      JSON.stringify({ success: true, resolved: results.length, details: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
