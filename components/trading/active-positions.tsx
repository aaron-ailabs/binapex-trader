"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Trophy, XCircle, Clock } from "lucide-react"
import { CircularTimer } from "@/components/ui/circular-timer"
import { useSound } from "@/lib/hooks/use-sound"
import { toast } from "sonner"

interface Trade {
    id: string
    asset_symbol: string
    direction: 'HIGH' | 'LOW'
    stake_amount: number
    locked_payout_rate: number
    status: 'pending' | 'won' | 'lost'
    created_at: string
    profit_loss?: number
    type: string // Added
    end_time: string // Added
}

export function ActivePositions() {
    const supabase = createClient()
    const [trades, setTrades] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { play } = useSound()

    // Fetch Initial Trades
    const fetchTrades = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'binary')
            .order('created_at', { ascending: false })
            .limit(20) // Show last 20

        if (data) setTrades(data)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchTrades()

        // Realtime Subscription - filtered by user
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
                .channel('realtime_orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`
                }, (payload: any) => {
                    // Play sounds on status change
                    if (payload.eventType === 'UPDATE') {
                        const newStatus = payload.new.status
                        const oldStatus = payload.old.status
                        if (oldStatus === 'OPEN') {
                            if (newStatus === 'WIN') play('success')
                            if (newStatus === 'LOSS') play('loss')
                        }
                    }
                    fetchTrades() // Refresh list on any change
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        const cleanup = setupSubscription()
        return () => {
            cleanup.then(unsub => unsub?.())
        }
    }, [play])

    return (
        <Card className="bg-white/5 border-white/10 flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-amber-500 font-bold tracking-widest text-sm uppercase">Live Positions</h3>
                {trades.some(t => t.status === 'OPEN') && (
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[500px] scrollbar-thin scrollbar-thumb-white/10">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-amber-500" /></div>
                ) : trades.length === 0 ? (
                    <div className="text-gray-500 text-center text-xs p-4">No active positions</div>
                ) : (
                    trades.map((trade: any) => {
                        const isCall = trade.direction === 'UP' || trade.direction === 'HIGH'
                        const isWin = trade.status === 'WIN'
                        const isLoss = trade.status === 'LOSS'
                        const isOpen = trade.status === 'OPEN'

                        // Read P/L directly from backend (no calculation)
                        const profitLoss = Number(trade.profit_loss || 0)
                        const payout = trade.payout || 0

                        // Timer logic
                        if (!trade.end_time && isOpen) return null
                        const totalDuration = (new Date(trade.end_time).getTime() - new Date(trade.created_at).getTime()) / 1000

                        return (
                            <Dialog key={trade.id}>
                                <DialogTrigger asChild>
                                    <div className={`cursor-pointer bg-black/40 p-3 rounded border flex justify-between items-center text-sm hover:bg-white/5 transition-colors ${isOpen ? 'border-amber-500/20' : 'border-white/5'}`}>
                                        <div className="flex flex-col gap-1 min-w-[30%]">
                                            <div className="font-bold text-white text-md flex items-center gap-2">
                                                {trade.asset_symbol}
                                            </div>
                                            <div className={`text-xs font-mono font-black tracking-wider ${isCall ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isCall ? '↑ CALL' : '↓ PUT'}
                                            </div>
                                        </div>

                                        {/* Show backend P/L for settled trades only */}
                                        {!isOpen && (isWin || isLoss) && (
                                            <div className="flex flex-col items-center min-w-[20%]">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Result</div>
                                                <div className={`font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isWin ? `+$${profitLoss.toFixed(2)}` : `-$${Number(trade.amount).toFixed(2)}`}
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-right flex items-center gap-3 min-w-[30%] justify-end">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="font-mono text-gray-300 font-bold">${Number(trade.amount).toFixed(2)}</div>
                                                {isOpen ? (
                                                    <Badge className="border-amber-500/50 text-amber-400 bg-amber-500/10 gap-1 text-[10px] px-2 animate-pulse">
                                                        <Clock size={10} /> Live
                                                    </Badge>
                                                ) : isWin ? (
                                                    <Badge className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 gap-1 text-[10px] px-2">
                                                        <Trophy size={10} /> ${payout > 0 ? payout.toFixed(2) : `+${profitLoss.toFixed(2)}`}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border-rose-500/50 text-rose-400 bg-rose-500/10 gap-1 text-[10px] px-2">
                                                        <XCircle size={10} /> Lost
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Timer for Open Trades */}
                                            {isOpen && trade.end_time && (
                                                <CircularTimer
                                                    duration={totalDuration}
                                                    expiryTime={new Date(trade.end_time)}
                                                    size={32}
                                                    onWarning={() => {
                                                        play('warning')
                                                        toast.warning("Trade Expiring", {
                                                            description: `${trade.asset_symbol} expires in 10 seconds!`
                                                        })
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1a1a1a] border-white/10 text-white sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center justify-between">
                                            <span>Trade Details</span>
                                            <Badge variant={isOpen ? "outline" : "default"} className={isOpen ? "border-amber-500 text-amber-500" : (isWin ? "bg-emerald-500" : "bg-rose-500")}>
                                                {trade.status}
                                            </Badge>
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                            Reference ID: #{trade.id.slice(0, 8)}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-gray-500 text-xs uppercase">Asset</p>
                                            <p className="font-bold">{trade.asset_symbol}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-gray-500 text-xs uppercase">Direction</p>
                                            <p className={`font-bold ${isCall ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isCall ? '↑ CALL (Higher)' : '↓ PUT (Lower)'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-500 text-xs uppercase">Stake</p>
                                            <p className="font-mono">${Number(trade.amount).toFixed(2)}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-gray-500 text-xs uppercase">Strike Price</p>
                                            <p className="font-mono">${Number(trade.strike_price || 0).toFixed(5)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-gray-500 text-xs uppercase">Final Price</p>
                                            <p className="font-mono">${trade.final_price ? Number(trade.final_price).toFixed(5) : 'Pending'}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-gray-500 text-xs uppercase">Duration</p>
                                            <p className="font-mono">{totalDuration}s</p>
                                        </div>
                                        {!isOpen && (
                                            <div className="col-span-2 pt-2 border-t border-white/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Result</span>
                                                    <span className={`text-lg font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {isWin ? `+$${profitLoss.toFixed(2)}` : `-$${Number(trade.amount).toFixed(2)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )
                    })
                )}
            </div>
        </Card>
    )
}
