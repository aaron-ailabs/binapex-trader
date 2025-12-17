"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { GlassCard } from "@/components/ui/glass-card"

interface TradeActionsProps {
  assetId: string
  symbol: string
  currentPrice: number
  balance: number
  onSuccess: () => void
}

export function TradeActions({ assetId, symbol, currentPrice, balance, onSuccess }: TradeActionsProps) {
  const supabase = createClient()
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [leverage, setLeverage] = useState([10])
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations
  const investmentAmount = Number.parseFloat(amount) || 0
  const totalSize = investmentAmount * leverage[0]
  const marginRequired = investmentAmount
  const assetQuantity = currentPrice > 0 ? totalSize / currentPrice : 0

  const handlePlaceTrade = async () => {
    if (!amount || investmentAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (balance < investmentAmount) {
      toast.error("Insufficient balance")
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke("place-order", {
        body: {
          symbol,
          side: orderType,
          type: "market",
          size: assetQuantity,
          leverage: leverage[0],
          price: currentPrice // Indicative for market order
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success(`${orderType === "buy" ? "Long" : "Short"} position opened for ${symbol}`)
      setAmount("")
      onSuccess()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to place trade"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <GlassCard className="p-4 flex flex-col gap-4 h-full">
        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "buy" | "sell")} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-black/20">
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              BUY / LONG
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold"
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              SELL / SHORT
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Available Balance</label>
            <div className="font-mono text-lg font-bold text-[#F59E0B]">
              ${balance.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 flex justify-between">
              <span>Leverage</span>
              <span className="text-white font-mono">{leverage[0]}x</span>
            </label>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              max={100}
              step={1}
              className="mt-2"
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1x</span>
              <span>50x</span>
              <span>100x</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Investment Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 font-mono">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-6 bg-black/50 border-white/10 font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg text-sm space-y-2 font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Margin Required</span>
              <span className="text-white">${marginRequired.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Total Position Size</span>
              <span className="text-white">${totalSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Asset Quantity</span>
              <span className="text-white">{assetQuantity.toFixed(6)}</span>
            </div>
          </div>

          <Button
            onClick={handlePlaceTrade}
            disabled={isSubmitting || !amount || Number(amount) <= 0}
            className={`w-full font-bold text-base h-12 ${
              orderType === "buy"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : orderType === "buy" ? "OPEN LONG POSITION" : "OPEN SHORT POSITION"}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By placing this order, you agree to the platform's terms and conditions
          </div>
        </div>
    </GlassCard>
  )
}
