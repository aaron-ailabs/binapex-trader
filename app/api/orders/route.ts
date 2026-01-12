import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { OrderMatchingEngine } from "@/lib/services/order-matching-engine"
import { z } from "zod"
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit"
import type { NextRequest } from "next/server"
import { captureApiError } from "@/lib/utils/error-handler"

const CreateOrderSchema = z.object({
  asset_id: z.string().uuid().optional(),
  symbol: z.string().optional(),
  pair: z.string().optional(),
  order_type: z.enum(["buy", "sell"]),
  type: z.enum(["limit", "market", "stop_limit"]).default("limit"),
  price: z.number().nonnegative().optional(), // Market orders might use 0 or null
  quantity: z.number().positive(),
  triggerPrice: z.number().positive().optional()
}).refine(data => data.asset_id || data.symbol || data.pair, {
  message: "Must provide asset_id, symbol, or pair"
});

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

    // 1. Validate Input using Zod
    const result = CreateOrderSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    const { asset_id, order_type, price, quantity, type, triggerPrice } = result.data
    const side = order_type.toLowerCase()

    // We expect 'asset_id' to be the TRADING PAIR ID if the frontend sends it, 
    // OR we expect a 'pair'/'symbol' string.
    // The previous code handled 'symbol' but the schema asked for 'asset_id' (UUID).
    // Let's support both for backward compat but ENFORCE strictness.

    let tradingPairId: string | null = null;

    // Check if body provided a UUID directly (Best Practice)
    if (z.string().uuid().safeParse(body.asset_id).success) {
      tradingPairId = body.asset_id
    } else {
      // Strict Symbol Lookup (No Fuzzy Matching)
      const rawSymbol = body.symbol || body.pair

      if (!rawSymbol) {
        return Response.json({ error: "Missing symbol or asset_id" }, { status: 400 })
      }

      const cleanSymbol = rawSymbol.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase(); // Allow hyphen

      const { data: pair } = await supabase
        .from('trading_pairs')
        .select('id, is_active')
        .eq('symbol', cleanSymbol) // STRICT MATCH
        .single();

      if (pair) {
        if (!pair.is_active) {
          return Response.json({ error: `Trading pair ${rawSymbol} is frozen` }, { status: 403 })
        }
        tradingPairId = pair.id
      }
    }

    if (!tradingPairId) {
      return Response.json({ error: "Invalid trading pair ID or Symbol" }, { status: 400 })
    }

    // 3. Atomic Order Placement (Spot/Exchange Engine)
    // We use the `limit_orders` table path for the matching engine
    const { data: rpcResult, error: rpcError } = await supabase.rpc("place_order_atomic", {
      p_user_id: user.id,
      p_trading_pair_id: tradingPairId,
      p_side: side,
      p_type: type,
      p_price: price,
      p_amount: quantity,
      p_trigger_price: triggerPrice || null
    })

    if (rpcError) {
      throw new Error(rpcError.message)
    }

    if (!rpcResult.success) {
      throw new Error(rpcResult.error || "Order placement failed")
    }

    const orderId = rpcResult.order_id

    // 4. Trigger Matching Engine (DECOUPLED - Now handled by place_order_atomic RPC)
    // We no longer need to trigger it in the API response thread.

    return Response.json({
      success: true,
      order_id: orderId,
      status: 'PENDING'
    })
  } catch (error) {
    captureApiError(error, {
      userId,
      endpoint: "/api/orders",
      action: "unified-create-order",
      metadata: { body: body || {} },
    })

    return Response.json({ error: error instanceof Error ? error.message : "Order implementation error" }, { status: 400 })
  }
}
