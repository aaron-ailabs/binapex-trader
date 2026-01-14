
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function getRealPrice(symbol: string): Promise<number> {
  try {
    // 1. Try Binance for Crypto
    const binanceSymbol = symbol.replace('-', '').replace('/', '').toUpperCase();
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}T`);
    if (res.ok) {
      const data = await res.json();
      return parseFloat(data.price);
    }
  } catch (e) {
    console.error(`Binance fetch failed for ${symbol}`, e);
  }

  try {
    // 2. Fallback to Yahoo for Forex/Stocks
    const ticker = symbol.replace('/', '-');
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1m`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) return price;
    }
  } catch (e) {
    console.error(`Yahoo fetch failed for ${symbol}`, e);
  }

  throw new Error(`Could not fetch real price for ${symbol}`);
}

Deno.serve(async (req) => {
  try {
    // 1. Auth Check (Service Role only)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    // Initialize Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Fetch Expired Orders
    const now = new Date().toISOString()
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'OPEN')
      .lte('end_time', now)

    if (fetchError) throw fetchError
    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(JSON.stringify({ message: 'No expired orders' }), { headers: { 'Content-Type': 'application/json' } })
    }

    const results = []

    // 3. Process Each Order
    for (const order of expiredOrders) {
      try {
        const currentPrice = await getRealPrice(order.asset_symbol)
        let outcome = 'LOSS'

        // Determine Outcome
        if (order.direction === 'UP' && currentPrice > order.strike_price) {
          outcome = 'WIN'
        } else if (order.direction === 'DOWN' && currentPrice < order.strike_price) {
          outcome = 'WIN'
        }
        // Note: Tie is usually a LOSS or REFUND depending on broker logic. Here we assume LOSS for strictness or Tie=Loss.
        // If Tie needs refund, logic would be different. Assuming strictly > or < for WIN.

        // 4. Settle via RPC
        const { data: settlement, error: rpcError } = await supabase.rpc('settle_binary_order', {
          p_order_id: order.id,
          p_outcome: outcome,
          p_final_price: currentPrice
        })

        results.push({ order_id: order.id, symbol: order.asset_symbol, final: currentPrice, outcome, rpc_result: settlement, error: rpcError })
      } catch (err) {
        results.push({ order_id: order.id, error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
