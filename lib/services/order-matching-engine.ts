import type { Order, ExecutedTrade, MatchingResult, FeeStructure } from "@/lib/types/orders"
import type { LimitOrder } from "@/lib/types/database"


export class OrderMatchingEngine {
  private supabase

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Match buy and sell orders for a given trading pair
   * Implements best-price matching: highest buy price >= lowest sell price
   */
  async matchOrders(tradingPairId: string): Promise<MatchingResult> {
    console.log(`[v0] Starting order matching for pair: ${tradingPairId}`)

    const result: MatchingResult = {
      success: true,
      executed_trades: [],
      filled_buy_orders: [],
      filled_sell_orders: [],
      errors: [],
    }

    try {
      // Fetch Trading Pair details (for fees)
      const { data: pair, error: pairError } = await this.supabase
        .from("trading_pairs")
        .select("buy_fee_percentage, sell_fee_percentage")
        .eq("id", tradingPairId)
        .single()

      if (pairError || !pair) throw new Error(`Failed to fetch trading pair fees: ${pairError?.message}`)

      const fees: FeeStructure = {
        buy_fee_percentage: Number(pair.buy_fee_percentage),
        sell_fee_percentage: Number(pair.sell_fee_percentage)
      }

      // Fetch all active buy orders sorted by price (highest first)
      const { data: buyOrders, error: buyError } = await this.supabase
        .from("limit_orders")
        .select("*")
        .eq("trading_pair_id", tradingPairId)
        .eq("side", "buy")
        .in("status", ["pending", "partially_filled"])
        .order("price", { ascending: false })

      if (buyError) throw new Error(`Failed to fetch buy orders: ${buyError.message}`)

      // Fetch all active sell orders sorted by price (lowest first)
      const { data: sellOrders, error: sellError } = await this.supabase
        .from("limit_orders")
        .select("*")
        .eq("trading_pair_id", tradingPairId)
        .eq("side", "sell")
        .in("status", ["pending", "partially_filled"])
        .order("price", { ascending: true })

      if (sellError) throw new Error(`Failed to fetch sell orders: ${sellError.message}`)

      // Match orders
      const buys = buyOrders as LimitOrder[]
      const sells = sellOrders as LimitOrder[]

      for (const buyOrder of buys) {
        if (buyOrder.remaining_amount <= 0) continue

        for (const sellOrder of sells) {
          if (sellOrder.remaining_amount <= 0) continue

          // Check if prices match: best buy price >= best sell price
          if (buyOrder.price >= sellOrder.price) {
            const matchAmount = Math.min(
              buyOrder.remaining_amount,
              sellOrder.remaining_amount
            )

            if (matchAmount > 0) {
              // Execute trade
              const trade = await this.executeTrade(
                buyOrder,
                sellOrder,
                matchAmount,
                sellOrder.price, // Execution price is the maker price (the one already on the book)
                fees
              )

              if (trade) {
                result.executed_trades.push(trade)

                // Update in-memory amounts to continue matching correctly in this loop
                buyOrder.filled_amount = Number(buyOrder.filled_amount) + matchAmount
                buyOrder.remaining_amount = Number(buyOrder.remaining_amount) - matchAmount
                
                sellOrder.filled_amount = Number(sellOrder.filled_amount) + matchAmount
                sellOrder.remaining_amount = Number(sellOrder.remaining_amount) - matchAmount

                // Track filled orders
                if (buyOrder.remaining_amount <= 1e-10) {
                  result.filled_buy_orders.push(buyOrder.id)
                }
                if (sellOrder.remaining_amount <= 1e-10) {
                  result.filled_sell_orders.push(sellOrder.id)
                }
              }
            }
          }
        }
      }

      console.log(`[v0] Order matching completed: ${result.executed_trades.length} trades executed`)
    } catch (error) {
      console.error("[v0] Order matching error:", error)
      result.success = false
      result.errors?.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  /**
   * Execute a single trade between buyer and seller using atomic RPC
   */
  private async executeTrade(
    buyOrder: LimitOrder,
    sellOrder: LimitOrder,
    amount: number,
    executionPrice: number,
    fees: FeeStructure
  ): Promise<ExecutedTrade | null> {
    try {
      const totalValue = amount * executionPrice
      const buyerFee = totalValue * fees.buy_fee_percentage
      const sellerFee = totalValue * fees.sell_fee_percentage
      const buyerNet = totalValue + buyerFee
      const sellerNet = totalValue - sellerFee

      console.log(
        `[v0] Executing trade - Buyer: ${buyOrder.user_id}, Seller: ${sellOrder.user_id}, Amt: ${amount}, Price: ${executionPrice}`,
      )

      // Call atomic RPC
      const { data, error } = await this.supabase.rpc("execute_trade_atomic", {
        p_buy_order_id: buyOrder.id,
        p_sell_order_id: sellOrder.id,
        p_match_amount: amount,
        p_execution_price: executionPrice,
        p_buyer_fee: buyerFee,
        p_seller_fee: sellerFee,
        p_buyer_id: buyOrder.user_id,
        p_seller_id: sellOrder.user_id,
        p_trading_pair_id: buyOrder.trading_pair_id
      })

      if (error) {
        throw new Error(`Atomic trade execution failed: ${error.message}`)
      }

      if (!data || !data.success) {
         throw new Error(`Atomic trade execution failed: ${data?.error || 'Unknown error'}`)
      }

      const tradeId = data.trade_id

      // Construct ExecutedTrade object for return (to update in-memory state or logs)
      // Note: DB is already updated.
      
      const executedTradeResult: ExecutedTrade = {
        id: tradeId,
        buyer_id: buyOrder.user_id,
        seller_id: sellOrder.user_id,
        trading_pair_id: buyOrder.trading_pair_id,
        price: executionPrice,
        amount,
        total_value: totalValue,
        buyer_fee: buyerFee,
        seller_fee: sellerFee,
        buyer_net: buyerNet,
        seller_net: sellerNet,
        executed_at: new Date().toISOString(), // Approximate, actual is DB time
      }

      return executedTradeResult
    } catch (error) {
      console.error("[v0] Trade execution error:", error)
      return null
    }
  }



  /**
   * Cancel an order and refund the buyer if applicable
   */
  async cancelOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc("cancel_order_atomic", {
        p_order_id: orderId,
        p_user_id: userId
      })

      if (error) {
        throw new Error(`Atomic cancel failed: ${error.message}`)
      }

      if (!data || !data.success) {
         throw new Error(`Atomic cancel failed: ${data?.error || 'Unknown error'}`)
      }

      console.log(`[v0] Order ${orderId} cancelled successfully`)
      return true
    } catch (error) {
      console.error("[v0] Order cancellation error:", error)
      return false
    }
  }
}
