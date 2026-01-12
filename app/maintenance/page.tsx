"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, Hammer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MaintenancePage() {
    const [message, setMessage] = useState("We are currently upgrading our systems to provide you with a better trading experience.")
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchMessage = async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_message')
                .single()
            if (data?.value) {
                setMessage(data.value)
            }
            setLoading(false)
        }
        fetchMessage()
    }, [])

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50 -z-10" />

            <div className="relative mb-8">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                <Hammer className="h-24 w-24 text-orange-500 relative z-10 animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                Under Maintenance
            </h1>

            <div
                className="max-w-xl text-zinc-400 text-lg mb-8 prose prose-invert"
                dangerouslySetInnerHTML={{ __html: message }}
            />

            <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.reload()}
                className="gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
            >
                <RefreshCw className="h-4 w-4" />
                Check Status
            </Button>

            <div className="mt-12 flex gap-4 text-sm text-zinc-600">
                <span className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    System Upgrade
                </span>
                <span>•</span>
                <span>Security Check</span>
                <span>•</span>
                <span>Database Optimization</span>
            </div>
        </div>
    )
}
