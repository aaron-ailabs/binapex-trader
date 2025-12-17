import { LimitOrder } from "./database"

// Order matching engine types
export type OrderSide = "buy" | "sell"
export type OrderType = "limit" | "market"
export type OrderStatus = "pending" | "partially_filled" | "filled" | "cancelled" | "expired"

// Alias Order to LimitOrder for backwards compatibility in matching engine
export type Order = LimitOrder

export interface ExecutedTrade {
  id: string
  buyer_id: string
  seller_id: string
  trading_pair_id: string
  price: number
  amount: number
  total_value: number
  buyer_fee: number
  seller_fee: number
  buyer_net: number
  seller_net: number
  executed_at: string
}

export interface MatchingResult {
  success: boolean
  executed_trades: ExecutedTrade[]
  filled_buy_orders: string[]
  filled_sell_orders: string[]
  errors?: string[]
}

export interface FeeStructure {
  buy_fee_percentage: number // 0.6%
  sell_fee_percentage: number // 1.1%
}
