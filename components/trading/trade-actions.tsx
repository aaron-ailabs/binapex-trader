"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { GlassCard } from "@/components/ui/glass-card"
import { DurationSelector } from "./duration-selector"
import { createTrade } from "@/app/actions/trade"
import { cn } from "@/lib/utils"

interface TradeActionsProps {
  assetId: string
  symbol: string
  currentPrice: number
  balance: number
  onSuccess: () => void
}

export function TradeActions({ assetId, symbol, currentPrice, balance, onSuccess }: TradeActionsProps) {
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [duration, setDuration] = useState(120)
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations
  const investmentAmount = Number.parseFloat(amount) || 0
  const payoutRate = 85 // Fixed 85% payout for now
  const potentialProfit = investmentAmount * (payoutRate / 100)
  const totalReturn = investmentAmount + potentialProfit

  const handleQuickAmount = (percentage: number) => {
    if (balance <= 0) return
    const newAmount = (balance * (percentage / 100)).toFixed(2)
    setAmount(newAmount)
  }

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
      // Use Server Action for Binary Trade
      const result = await createTrade(
        investmentAmount,
        symbol,
        orderType === "buy" ? "UP" : "DOWN",
        duration,
        payoutRate
      )

      if (result.error) throw new Error(result.error)

      toast.success(`${orderType === "buy" ? "Call (Up)" : "Put (Down)"} trade opened for ${symbol}`)
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
              CALL / UP
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold"
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              PUT / DOWN
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

          <DurationSelector value={duration} onChange={setDuration} />

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Investment Amount (USD)</label>
            <div className="relative mb-2">
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
            
            {/* Quick Sizing Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickAmount(pct)}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-800 text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-500 border border-transparent hover:border-emerald-500/50 transition-colors"
                >
                  {pct === 100 ? "Max" : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg text-sm space-y-2 font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Payout Rate</span>
              <span className="text-emerald-400">{payoutRate}%</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Potential Profit</span>
              <span className="text-emerald-400">+${potentialProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 border-t border-white/10 pt-2 mt-2">
              <span>Total Return</span>
              <span className="text-white font-bold">${totalReturn.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handlePlaceTrade}
            disabled={isSubmitting || !amount || Number(amount) <= 0}
            className={cn(
              "w-full font-bold text-base h-12 transition-all",
              orderType === "buy"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            )}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : orderType === "buy" ? "CALL (UP)" : "PUT (DOWN)"}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Trade will expire in {duration} seconds
          </div>
        </div>
    </GlassCard>
  )
}
