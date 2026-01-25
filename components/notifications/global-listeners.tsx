"use client"

import { useEffect, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useSoundEffects } from "@/hooks/use-sound-effects"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function GlobalNotificationListener() {
    const { user } = useAuth()
    const supabase = useMemo(() => createClient(), [])
    const { play } = useSoundEffects()
    const router = useRouter()
    const processedIds = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!user) return

        // 1. Chat Messages Listener
        const chatChannel = supabase
            .channel(`global_chat:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'support_messages',
                filter: `user_id=eq.${user.id}`
            }, (payload: any) => {
                const msg = payload.new
                // Only notify for admin messages
                if (msg.sender_role === 'admin') {
                    play('notification')
                    toast("New Support Message", {
                        description: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
                        action: {
                            label: "View",
                            onClick: () => router.push('/support')
                        }
                    })
                }
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime subscription error for global_chat')
                }
            })

        // 2. Transactions Listener (Deposits/Withdrawals)
        const txChannel = supabase
            .channel(`global_tx:${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${user.id}`
            }, (payload: any) => {
                const newTx = payload.new
                const oldTx = payload.old

                // Only notify on status change
                if (newTx.status !== oldTx.status) {
                    const type = newTx.type === 'deposit' ? 'Deposit' : 'Withdrawal'
                    const amount = newTx.amount ? `$${newTx.amount}` : 'Amount'

                    if (newTx.status === 'completed' || newTx.status === 'approved') {
                        play('success')
                        toast.success(`${type} Approved`, {
                            description: `Your ${type.toLowerCase()} of ${amount} has been processed successfully.`
                        })
                    } else if (newTx.status === 'rejected') {
                        play('error') // Assuming 'error' or 'loss' sound exists
                        toast.error(`${type} Rejected`, {
                            description: `Reason: ${newTx.metadata?.rejection_reason || "Contact support"}`
                        })
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime subscription error for global_tx')
                }
            })

        // 3. Trade Result Listener (Orders)
        const orderChannel = supabase
            .channel(`global_orders:${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `user_id=eq.${user.id}`
            }, (payload: any) => {
                const newOrder = payload.new
                const oldOrder = payload.old

                if (oldOrder.status === 'OPEN' && newOrder.status !== 'OPEN') {
                    const symbol = newOrder.asset_symbol
                    const pl = newOrder.profit_loss || 0

                    if (newOrder.status === 'WIN') {
                        toast.success("Trade Won", {
                            description: `${symbol}: +$${(newOrder.amount + pl).toFixed(2)}`
                        })
                    } else if (newOrder.status === 'LOSS') {
                        toast.error("Trade Lost", {
                            description: `${symbol}: -$${newOrder.amount}`
                        })
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime subscription error for global_orders')
                }
            })

        return () => {
            supabase.removeChannel(chatChannel)
            supabase.removeChannel(txChannel)
            supabase.removeChannel(orderChannel)
        }
    }, [user, supabase, play, router])

    return null
}
