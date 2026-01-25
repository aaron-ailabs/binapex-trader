"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Bell, Check, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
// Using date-fns/formatDistanceToNow for relative time
import { formatDistanceToNow } from "date-fns"
import { useSoundEffects } from "@/hooks/use-sound-effects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Notification {
    id: string
    type: 'deposit' | 'withdrawal' | 'trade' | 'security' | 'system' | 'chat'
    title: string
    message: string
    link?: string
    is_read: boolean
    created_at: string
}

export function UserNotificationBell() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = useMemo(() => createClient(), [])
    const { play } = useSoundEffects()
    const router = useRouter()

    const fetchNotifications = useCallback(async () => {
        if (!user) return

        const { data, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq('user_id', user.id)
            .order("created_at", { ascending: false })
            .limit(10)

        if (!error && data) {
            setNotifications(data as Notification[])
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
        }
    }, [user, supabase])

    useEffect(() => {
        if (!user) return
        fetchNotifications()

        const channel = supabase
            .channel(`user_notifications:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "user_notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications((prev) => [newNotif, ...prev])
                    setUnreadCount((prev) => prev + 1)

                    // Determine sound based on type and content
                    if (newNotif.type === 'trade') {
                        if (newNotif.title.includes('Won')) {
                            play('success')
                        } else if (newNotif.title.includes('Finished') || newNotif.title.includes('Lost')) {
                            play('loss')
                        } else {
                            play('notification')
                        }
                    } else if (newNotif.type === 'deposit') {
                        if (newNotif.title.includes('Confirmed')) {
                            play('success')
                        } else {
                            play('warning')
                        }
                    } else if (newNotif.type === 'chat') {
                        play('notification')
                    } else {
                        play('notification')
                    }

                    toast(newNotif.title, {
                        description: newNotif.message,
                    })
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error(`Realtime subscription error for user_notifications:${user.id}`)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, fetchNotifications, play, supabase])

    const markAsRead = async (id: string, link?: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await supabase
            .from("user_notifications")
            .update({ is_read: true })
            .eq("id", id)

        if (link) {
            router.push(link)
        }
    }

    const markAllAsRead = async () => {
        if (!user) return
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)

        await supabase
            .from("user_notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-white/10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 animate-pulse border-none"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-[#0F0F0F] border-zinc-800 text-zinc-100 shadow-xl shadow-black/50">
                <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                    <span className="font-semibold px-1">Notifications</span>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                </DropdownMenuLabel>

                <div className="max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-zinc-600 flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <span>No new notifications</span>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem
                                key={notif.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-white/5 border-b border-zinc-800/30 last:border-0",
                                    !notif.is_read ? "bg-white/[0.02]" : "opacity-70"
                                )}
                                onClick={() => markAsRead(notif.id, notif.link)}
                            >
                                <div className="flex w-full items-center justify-between gap-2 mb-0.5">
                                    <div className="flex items-center gap-2">
                                        {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                        <span className={cn(
                                            "text-xs font-medium uppercase tracking-wider",
                                            notif.type === 'deposit' ? "text-green-400" :
                                                notif.type === 'withdrawal' ? "text-blue-400" :
                                                    notif.type === 'trade' ? "text-yellow-400" :
                                                        notif.type === 'chat' ? "text-purple-400" :
                                                            "text-zinc-400"
                                        )}>
                                            {notif.type}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-zinc-200 leading-none mb-0.5">{notif.title}</p>
                                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{notif.message}</p>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
