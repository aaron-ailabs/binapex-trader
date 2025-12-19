import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { OrderMatchingEngine } from "@/lib/services/order-matching-engine"
import { z } from "zod"
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit"
import type { NextRequest } from "next/server"
import { captureApiError } from "@/lib/utils/error-handler"

const CreateOrderSchema = z.object({
  asset_id: z.string().uuid(),
  order_type: z.enum(["buy", "sell"]),
  price: z.number().positive(),
  quantity: z.number().positive(),
})

export async function POST(request: NextRequest) {
  let userId: string | undefined
  let body: any = {}

  try {
    const rateLimitResponse = rateLimitMiddleware(request, 20, 60000)
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    userId = user.id
    body = await request.json()

    // allow 'symbol' or 'asset_id' for backward compatibility, but prefer symbol for pair lookup
    const { symbol, asset_id, order_type, price, quantity, type = 'limit' } = body

    if (!order_type || !quantity) {
        return Response.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Resolve Trading Pair
    let tradingPairId: string | null = null;

    if (symbol) {
        // 1. Try exact match (e.g. "BTCUSD" from some sources)
        const { data: exactPair } = await supabase.from('trading_pairs').select('id').eq('symbol', symbol).single();
        if (exactPair) {
            tradingPairId = exactPair.id
        } else {
            // 2. Try normalized (remove separators) e.g. "BTC-USD" -> "BTCUSD" (common for Crypto/Forex)
            const normalized = symbol.replace(/[-/]/g, '');
            const { data: normPair } = await supabase.from('trading_pairs').select('id').eq('symbol', normalized).single();
            if (normPair) {
                tradingPairId = normPair.id
            } else {
                // 3. Try base symbol only (e.g. "AAPL-USD" -> "AAPL" for Stocks)
                const base = symbol.split(/[-/]/)[0];
                 const { data: basePair } = await supabase.from('trading_pairs').select('id').eq('symbol', base).single();
                 if (basePair) tradingPairId = basePair.id;
            }
        }
    }
    
    // Fallback: if asset_id provided (legacy), try to find pair with base_currency = asset.symbol?
    // Or just fail if no symbol.
    if (!tradingPairId) {
        // Just for robustness, if only asset_id is sent:
        // This relies on asset_id being UUID of "assets".
        if (asset_id && !symbol) {
             const { data: asset } = await supabase.from('assets').select('symbol').eq('id', asset_id).single()
             if (asset) {
                 // Assume Pair is ASSET-USD
                 const pairSymbol = `${asset.symbol}-USD`
                 const { data: pair } = await supabase.from('trading_pairs').select('id').eq('symbol', pairSymbol).single()
                 if (pair) tradingPairId = pair.id
             }
        }
    }

    if (!tradingPairId) {
        return Response.json({ error: "Invalid trading pair or symbol" }, { status: 400 })
    }

    // Call Atomic RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc("place_order_atomic", {
      p_user_id: user.id,
      p_trading_pair_id: tradingPairId,
      p_side: order_type, // 'buy' or 'sell'
      p_price: price || 0, // Market orders might have 0 price?
      p_amount: quantity,
      p_type: type.toLowerCase() // 'limit' or 'market'
    })

    if (rpcError) {
        throw new Error(rpcError.message)
    }

    if (!rpcResult.success) {
        throw new Error(rpcResult.error || "Order placement failed")
    }

    const orderId = rpcResult.order_id

    // Trigger Matching Engine (Run async? Or await?)
    // Await for immediate feedback is better for UX.
    const engine = new OrderMatchingEngine(supabase)
    const matchingResult = await engine.matchOrders(tradingPairId)

    return Response.json({
      success: true,
      order_id: orderId,
      matching_result: matchingResult,
    })
  } catch (error) {
    captureApiError(error, {
      userId,
      endpoint: "/api/orders",
      action: "create-order",
      metadata: { body: body || {} },
    })

    return Response.json({ error: error instanceof Error ? error.message : "Order creation failed" }, { status: 400 })
  }
}
