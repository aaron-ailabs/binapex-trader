"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlassCard } from "@/components/ui/glass-card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import type { Transaction, Trade, Asset, BinaryOrder } from "@/lib/types/database"
import { format } from "date-fns"
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

import { PaginationControls } from "@/components/ui/pagination-controls"

interface HistoryTabsProps {
  transactions: Transaction[]
  trades: (Trade & { asset?: Asset })[]
  binaryOrders: BinaryOrder[]
  currentPage: number
  transactionsCount: number
  tradesCount: number
  binaryOrdersCount: number
  pageSize: number
}

export function HistoryTabs({
  transactions,
  trades,
  binaryOrders,
  currentPage,
  transactionsCount,
  tradesCount,
  binaryOrdersCount,
  pageSize
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState("transactions")
  const [liveTransactions, setLiveTransactions] = useState(transactions)
  const [liveBinaryOrders, setLiveBinaryOrders] = useState(binaryOrders)
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  // Update local state when props change (pagination)
  useEffect(() => {
    setLiveTransactions(transactions)
  }, [transactions])

  useEffect(() => {
    setLiveBinaryOrders(binaryOrders)
  }, [binaryOrders])

  // Realtime subscription for transaction status updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`history_transactions:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Update transaction in list
        setLiveTransactions(prev =>
          prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t)
        )

        // Show toast for status changes
        if (payload.old.status !== payload.new.status) {
          const txType = payload.new.type
          if (payload.new.status === 'completed' || payload.new.status === 'approved') {
            toast.success(`${txType} Approved`, {
              description: `Your ${txType} has been processed successfully.`
            })
          }
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for history_transactions:${user.id}`)
        }
      })

    // Subscribe to binary orders updates
    const ordersChannel = supabase
      .channel(`history_orders:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setLiveBinaryOrders(prev =>
          prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
        )
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for history_orders:${user.id}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(ordersChannel)
    }
  }, [user, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "failed":
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getTradeStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      case "liquidated":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const transactionsPages = Math.ceil(transactionsCount / pageSize)
  const tradesPages = Math.ceil(tradesCount / pageSize)
  const binaryPages = Math.ceil(binaryOrdersCount / pageSize)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-xl grid-cols-3 bg-black/20">
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="trades">Trade History</TabsTrigger>
        <TabsTrigger value="binary">Binary Options</TabsTrigger>
      </TabsList>

      <TabsContent value="transactions" className="mt-6">
        <GlassCard className="p-6">
          {liveTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No transactions found</p>
            </div>
          ) : (
            <>
            <DataTable
              data={liveTransactions}
              columns={[
                {
                  header: "Date",
                  accessor: (row: Transaction) => (
                    <div>
                      <div className="text-white">{format(new Date(row.created_at), "MMM dd, yyyy")}</div>
                      <div className="text-xs text-gray-400">{format(new Date(row.created_at), "HH:mm:ss")}</div>
                    </div>
                  ),
                },
                {
                  header: "Type",
                  accessor: (row: Transaction) => (
                    <span className="capitalize text-white font-medium">{row.type.replace("_", " ")}</span>
                  ),
                },
                {
                  header: "Amount",
                  accessor: (row: Transaction) => (
                    <span
                      className={`font-mono font-bold ${
                        row.type === "deposit" || row.type === "trade_profit" ? "text-emerald-500" : "text-white"
                      }`}
                    >
                      {row.type === "deposit" || row.type === "trade_profit" ? "+" : "-"}$
                      {Math.abs(row.amount).toFixed(2)}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  accessor: (row: Transaction) => (
                    <Badge variant="outline" className={getStatusColor(row.status)}>
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  header: "Method",
                  accessor: (row: Transaction) => (
                    <span className="text-sm text-gray-400 capitalize">{row.payment_method || "N/A"}</span>
                  ),
                },
                {
                  header: "Receipt",
                  accessor: (row: Transaction) =>
                    row.receipt_url ? (
                      <a
                        href={row.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#F59E0B] hover:text-[#FBBF24] flex items-center gap-1"
                      >
                        <span className="text-sm">View</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-600">-</span>
                    ),
                },
              ]}
            />
            <PaginationControls totalPages={transactionsPages} currentPage={currentPage} />
            </>
          )}
        </GlassCard>
      </TabsContent>

      <TabsContent value="trades" className="mt-6">
        <GlassCard className="p-6">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No trades found</p>
            </div>
          ) : (
            <>
            <DataTable
              data={trades}
              columns={[
                {
                  header: "Date",
                  accessor: (row: Trade) => (
                    <div>
                      <div className="text-white">{format(new Date(row.opened_at), "MMM dd, yyyy")}</div>
                      <div className="text-xs text-gray-400">{format(new Date(row.opened_at), "HH:mm")}</div>
                    </div>
                  ),
                },
                {
                  header: "Asset",
                  accessor: (row: Trade & { asset?: Asset }) => (
                    <div>
                      <div className="text-white font-medium">{row.asset?.symbol || "N/A"}</div>
                      <div className="text-xs text-gray-400">{row.asset?.name || ""}</div>
                    </div>
                  ),
                },
                {
                  header: "Type",
                  accessor: (row: Trade) => (
                    <Badge
                      variant="outline"
                      className={
                        row.type === "buy"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {row.type === "buy" ? "LONG" : "SHORT"}
                    </Badge>
                  ),
                },
                {
                  header: "Entry",
                  accessor: (row: Trade) => <span className="font-mono text-white">${row.entry_price.toFixed(2)}</span>,
                },
                {
                  header: "Exit",
                  accessor: (row: Trade) => (
                    <span className="font-mono text-white">
                      {row.exit_price ? `$${row.exit_price.toFixed(2)}` : "-"}
                    </span>
                  ),
                },
                {
                  header: "Size",
                  accessor: (row: Trade) => <span className="font-mono text-gray-400">{row.size.toFixed(4)}</span>,
                },
                {
                  header: "Leverage",
                  accessor: (row: Trade) => <span className="font-mono text-gray-400">{row.leverage}x</span>,
                },
                {
                  header: "P/L",
                  accessor: (row: Trade) => {
                    const pl = row.profit_loss;
                    if (pl === null || pl === undefined) {
                         return <span className="text-gray-500 font-mono">--</span>;
                    }
                    return (
                        <span
                          className={`font-mono font-bold ${pl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                        </span>
                    );
                  },
                },
                {
                  header: "Status",
                  accessor: (row: Trade) => (
                    <Badge variant="outline" className={getTradeStatusColor(row.status)}>
                      {row.status}
                    </Badge>
                  ),
                },
              ]}
            />
            <PaginationControls totalPages={tradesPages} currentPage={currentPage} />
            </>
          )}
        </GlassCard>
      </TabsContent>

      <TabsContent value="binary" className="mt-6">
        <GlassCard className="p-6">
          {binaryOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No binary trades found</p>
            </div>
          ) : (
            <>
            <DataTable
              data={liveBinaryOrders}
              columns={[
                {
                  header: "Date",
                  accessor: (row: BinaryOrder) => (
                    <div>
                      <div className="text-white">{format(new Date(row.created_at), "MMM dd, yyyy")}</div>
                      <div className="text-xs text-gray-400">{format(new Date(row.created_at), "HH:mm")}</div>
                    </div>
                  ),
                },
                {
                  header: "Asset",
                  accessor: (row: BinaryOrder) => (
                    <span className="text-white font-medium">{row.asset_symbol}</span>
                  ),
                },
                {
                  header: "Direction",
                  accessor: (row: BinaryOrder) => (
                    <Badge
                      variant="outline"
                      className={
                        row.direction === "UP"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {row.direction === "UP" ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                      {row.direction === "UP" ? "HIGH" : "LOW"}
                    </Badge>
                  ),
                },
                {
                  header: "Amount",
                  accessor: (row: BinaryOrder) => <span className="font-mono text-white">${row.amount.toFixed(2)}</span>,
                },
                {
                  header: "Strike",
                  accessor: (row: BinaryOrder) => <span className="font-mono text-gray-400">${row.strike_price.toFixed(2)}</span>,
                },
                {
                  header: "Exit",
                  accessor: (row: BinaryOrder) => (
                    <span className="font-mono text-white">
                      {row.exit_price ? `$${row.exit_price.toFixed(2)}` : "-"}
                    </span>
                  ),
                },
                {
                  header: "Payout %",
                  accessor: (row: BinaryOrder) => <span className="font-mono text-amber-500">{row.payout_rate}%</span>,
                },
                {
                  header: "Profit/Loss",
                  accessor: (row: BinaryOrder) => {
                    // Read P/L directly from backend (no calculation)
                    if (row.status === "OPEN") return <span className="text-gray-500 font-mono">Pending</span>

                    const pl = row.profit_loss
                    if (pl === null || pl === undefined) {
                      return <span className="text-gray-500 font-mono">--</span>
                    }

                    return (
                        <span
                          className={`font-mono font-bold ${pl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                        </span>
                    )
                  },
                },
                {
                  header: "Status",
                  accessor: (row: BinaryOrder) => (
                    <Badge variant="outline" className={
                      row.status === "OPEN" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      row.status === "WIN" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    }>
                      {row.status}
                    </Badge>
                  ),
                },
              ]}
            />
            <PaginationControls totalPages={binaryPages} currentPage={currentPage} />
            </>
          )}
        </GlassCard>
      </TabsContent>
    </Tabs>
  )
}
