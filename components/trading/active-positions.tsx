"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2, Trophy, XCircle, Clock } from "lucide-react"
import { CircularTimer } from "@/components/ui/circular-timer"
import { useSound } from "@/lib/hooks/use-sound"

interface Trade {
    id: string
    symbol: string
    side: 'buy' | 'sell'
    size: number
    status: 'OPEN' | 'WIN' | 'LOSS' | 'FILLED'
    created_at: string
    expiry_at: string
    profit_loss?: number
}

export function ActivePositions() {
    const supabase = createClient()
    const [trades, setTrades] = useState<Trade[]>([])
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
            .order('created_at', { ascending: false })
            .limit(20) // Show last 20
        
        if (data) setTrades(data as unknown as Trade[])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchTrades()

        // Realtime Subscription
        const channel = supabase
            .channel('realtime_orders')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders' 
            }, (payload) => {
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
    }, [play])

    return (
        <Card className="bg-white/5 border-white/10 flex flex-col h-full">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-amber-500 font-bold tracking-widest text-sm uppercase">Live Positions</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[500px] scrollbar-thin scrollbar-thumb-white/10">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-amber-500"/></div>
                ) : trades.length === 0 ? (
                    <div className="text-gray-500 text-center text-xs p-4">No active positions</div>
                ) : (
                    trades.map(trade => {
                        const isCall = trade.side === 'buy'
                        const isWin = trade.status === 'WIN'
                        const isLoss = trade.status === 'LOSS'
                        const isOpen = trade.status === 'OPEN'
                        
                        // Calculate duration for timer
                        const start = new Date(trade.created_at).getTime()
                        const end = new Date(trade.expiry_at).getTime()
                        const duration = Math.max(120, (end - start) / 1000) // Default or calc

                        return (
                            <div key={trade.id} className="bg-black/40 p-3 rounded border border-white/5 flex justify-between items-center text-sm hover:bg-white/5 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-white text-md">{trade.symbol}</div>
                                    <div className={`text-xs font-mono font-black tracking-wider ${isCall ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {isCall ? '↑ CALL' : '↓ PUT'}
                                    </div>
                                </div>
                                
                                <div className="text-right flex items-center gap-3">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="font-mono text-gray-300 font-bold">${Number(trade.size).toFixed(2)}</div>
                                        {isOpen ? (
                                            <Badge className="border-amber-500/50 text-amber-400 bg-amber-500/10 gap-1 text-[10px] px-2">
                                                <Clock size={10} /> Live
                                            </Badge>
                                        ) : isWin ? (
                                            <Badge className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 gap-1 text-[10px] px-2">
                                                <Trophy size={10} /> +${(Number(trade.profit_loss || 0) + Number(trade.size)).toFixed(2)}
                                            </Badge>
                                        ) : (
                                            <Badge className="border-rose-500/50 text-rose-400 bg-rose-500/10 gap-1 text-[10px] px-2">
                                                <XCircle size={10} /> $0.00
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Timer for Open Trades */}
                                    {isOpen && trade.expiry_at && (
                                        <CircularTimer 
                                            duration={duration} 
                                            expiryTime={new Date(trade.expiry_at)} 
                                            size={32}
                                            onWarning={() => play('warning')}
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </Card>
    )
}
