import { z } from "zod"

// Order schemas
export const CreateOrderSchema = z.object({
  asset_id: z.string().uuid("Invalid asset ID"),
  order_type: z.enum(["market", "limit", "stop_loss", "take_profit"]),
  size: z.number().positive("Size must be positive"),
  leverage: z.number().int().min(1).max(100, "Leverage must be between 1 and 100"),
  entry_price: z.number().positive().optional(),
  risk_mode: z.enum(["conservative", "moderate", "aggressive"]).optional(),
})

export const CancelOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
})

// Limit order schemas
export const CreateLimitOrderSchema = z.object({
  trading_pair_id: z.string().uuid("Invalid trading pair ID"),
  side: z.enum(["buy", "sell"]),
  order_type: z.enum(["limit", "stop_limit"]),
  price: z.number().positive("Price must be positive"),
  amount: z.number().positive("Amount must be positive"),
  stop_price: z.number().positive().optional(),
})

export const CancelLimitOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
})

// Trade schemas
export const OpenTradeSchema = z.object({
  asset_id: z.string().uuid("Invalid asset ID"),
  type: z.enum(["long", "short"]),
  size: z.number().positive("Size must be positive"),
  leverage: z.number().int().min(1).max(100),
  entry_price: z.number().positive("Entry price must be positive"),
})

export const CloseTradeSchema = z.object({
  tradeId: z.string().uuid("Invalid trade ID"),
  exit_price: z.number().positive("Exit price must be positive"),
})

// Type exports
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>
export type CreateLimitOrderInput = z.infer<typeof CreateLimitOrderSchema>
export type CancelLimitOrderInput = z.infer<typeof CancelLimitOrderSchema>
export type OpenTradeInput = z.infer<typeof OpenTradeSchema>
export type CloseTradeInput = z.infer<typeof CloseTradeSchema>
