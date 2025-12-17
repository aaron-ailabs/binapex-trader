"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, TrendingUp, TrendingDown, XCircle } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLiveData } from "@/hooks/use-live-data"

interface RiskMonitorProps {
  openTrades: any[]
}

export function RiskMonitor({ openTrades: initialTrades }: RiskMonitorProps) {
  const router = useRouter()
  const supabase = createClient()
  const openTrades = useLiveData("trades", initialTrades, { column: "created_at", ascending: false }).filter(
    (t: any) => t.status === "open",
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [closing, setClosing] = useState<string | null>(null)

  const filteredTrades = openTrades.filter(
    (trade: any) =>
      trade.assets?.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const calculatePnL = (trade: any) => {
    if (!trade.assets?.current_price) return 0
    const priceDiff =
      trade.type === "buy"
        ? trade.assets.current_price - trade.entry_price
        : trade.entry_price - trade.assets.current_price
    return (priceDiff / trade.entry_price) * trade.size * trade.leverage
  }

  const handleForceClose = async (trade: any) => {
    if (!confirm(`Force close this ${trade.assets?.symbol} position?`)) return

    setClosing(trade.id)
    try {
      const currentPnL = calculatePnL(trade)
      const exitPrice = trade.assets?.current_price || trade.entry_price

      // Close the trade
      const { error: tradeError } = await supabase
        .from("trades")
        .update({
          status: "liquidated",
          exit_price: exitPrice,
          profit_loss: currentPnL,
          closed_at: new Date().toISOString(),
        })
        .eq("id", trade.id)

      if (tradeError) throw tradeError

      // Update user balance
      const newBalance = Number(trade.profiles?.balance_usd || 0) + Number(trade.margin_used) + Number(currentPnL)
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance_usd: newBalance })
        .eq("id", trade.user_id)

      if (balanceError) throw balanceError

      // Log admin action
      await supabase.from("admin_logs").insert({
        action: "force_closed_trade",
        target_user_id: trade.user_id,
        details: { trade_id: trade.id, pnl: currentPnL },
      })

      toast.success("Position force closed")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to close position")
    } finally {
      setClosing(null)
    }
  }

  const totalExposure = openTrades.reduce((sum: number, trade: any) => sum + Number(trade.margin_used), 0)
  const totalPnL = openTrades.reduce((sum: number, trade: any) => sum + calculatePnL(trade), 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <AlertTriangle className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Positions</p>
              <p className="text-3xl font-bold text-white font-mono">{openTrades.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Exposure</p>
              <p className="text-3xl font-bold text-white font-mono">${totalExposure.toFixed(2)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${totalPnL >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}
            >
              {totalPnL >= 0 ? (
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Unrealized P/L</p>
              <p className={`text-3xl font-bold font-mono ${totalPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                ${totalPnL.toFixed(2)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by asset, user email, or name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md bg-black/50 border-white/10"
      />

      {/* Trades Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asset</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Entry</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Leverage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Margin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">P/L</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Risk Mode</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Opened</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade: any) => {
                const unrealizedPnL = calculatePnL(trade)
                return (
                  <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm text-white">{trade.profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{trade.profiles?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-bold text-white">{trade.assets?.symbol || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{trade.assets?.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          trade.type === "buy"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }
                      >
                        {trade.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-white font-mono">${Number(trade.entry_price).toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-white font-mono">
                        ${Number(trade.assets?.current_price || 0).toFixed(2)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-white font-mono">{Number(trade.size).toFixed(4)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {trade.leverage}x
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-white font-mono">${Number(trade.margin_used).toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p
                        className={`text-sm font-mono font-bold ${unrealizedPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}
                      >
                        ${unrealizedPnL.toFixed(2)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          trade.profiles?.risk_mode === "winning"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : trade.profiles?.risk_mode === "losing"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }
                      >
                        {trade.profiles?.risk_mode || "standard"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(trade.opened_at), "MMM dd, HH:mm")}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => handleForceClose(trade)}
                        disabled={closing === trade.id}
                        variant="outline"
                        size="sm"
                        className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {closing === trade.id ? "Closing..." : "Force Close"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredTrades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No open positions</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
