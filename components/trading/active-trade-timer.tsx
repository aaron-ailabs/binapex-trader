"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Bell, BellOff, X } from "lucide-react"

// Sound Hook
function useSound(enabled: boolean) {
    const play = (type: 'warning' | 'expiry' | 'success' | 'loss') => {
        if (!enabled) return
        // Mock sound paths - in real app would point to /sounds/warning.mp3 etc
        const audio = new Audio(`/sounds/${type}.mp3`)
        audio.play().catch(e => console.log('Audio play failed', e))
    }
    return { play }
}

interface Trade {
    id: string
    asset_symbol: string
    amount: number
    direction: 'UP' | 'DOWN'
    end_time: string
    expiry_at: string
    created_at?: string
}

export function ActiveTradeTimer({ trade, onComplete }: { trade: Trade, onComplete?: () => void }) {
    const supabase = createClient()
    const [timeLeft, setTimeLeft] = useState(0)
    const [totalDuration, setTotalDuration] = useState(100)
    const [soundEnabled, setSoundEnabled] = useState(true)

    const { play } = useSound(soundEnabled)

    useEffect(() => {
        // Fetch user sound preference
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                supabase.from('profiles').select('sound_enabled').eq('id', data.user.id).single()
                    .then(({ data: profile }) => {
                        if (profile) setSoundEnabled(profile.sound_enabled)
                    })
            }
        })
    }, [])

    useEffect(() => {
        const end = new Date(trade.expiry_at || trade.end_time).getTime()
        const now = Date.now()
        const duration = end - new Date(trade.created_at || Date.now()).getTime() // Approximating start if not strictly stored here
        // Better: use expiry - now
        setTotalDuration(Math.max(1, (end - now) / 1000)) // initial

        const interval = setInterval(() => {
            const remaining = Math.max(0, (end - Date.now()) / 1000)
            setTimeLeft(remaining)

            if (remaining <= 10 && remaining > 9) play('warning')
            if (remaining === 0) {
                play('expiry')
                clearInterval(interval)
                onComplete?.()
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [trade.end_time])

    // Visuals
    const percentage = Math.min(100, Math.max(0, (timeLeft / totalDuration) * 100))

    // Colors
    let color = "#10B981" // Emerald
    if (percentage < 50) color = "#EAB308" // Gold
    if (timeLeft <= 30) color = "#EF4444" // Red

    return (
        <div className="relative w-full max-w-[200px] mx-auto p-4 flex flex-col items-center">
            <div className="relative w-32 h-32">
                {/* SVG Circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#1F2937"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * percentage) / 100}
                        animate={{
                            stroke: color,
                            strokeDashoffset: 283 - (283 * percentage) / 100
                        }}
                        transition={{ duration: 0.5, ease: "linear" }}
                        className={timeLeft <= 10 ? "animate-pulse" : ""}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold font-mono text-white">
                        {Math.floor(timeLeft)}s
                    </span>
                    <span className="text-xs text-gray-400">{trade.asset_symbol}</span>
                </div>
            </div>

            <div className="mt-2 flex gap-2">
                {/* Sound Toggle - small extra */}
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-xs text-gray-400 hover:text-white">
                    {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
            </div>
        </div>
    )
}
