"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [checking, setChecking] = useState(true)
    const [maintenance, setMaintenance] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const checkStatus = async () => {
            // 1. Check Maintenance Setting
            const { data: settings } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single()

            const isMaintenance = settings?.value === 'true'
            setMaintenance(isMaintenance)

            if (isMaintenance) {
                // 2. Allow Admin Bypass
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile?.role === 'admin') {
                        setChecking(false)
                        return // Allow access
                    }
                }

                // 3. Redirect if not admin and page is not already /maintenance
                if (pathname !== '/maintenance') {
                    router.push('/maintenance')
                }
            } else {
                // Not in maintenance, but on maintenance page? Redirect home
                if (pathname === '/maintenance') {
                    router.push('/')
                }
            }
            setChecking(false)
        }

        checkStatus()

        // Realtime listener for setting change
        const channel = supabase
            .channel('maintenance_guard')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: "key=eq.maintenance_mode" },
                (payload) => {
                    const isMode = payload.new.value === 'true'
                    if (isMode) window.location.href = '/maintenance'
                    else if (pathname === '/maintenance') window.location.href = '/'
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [pathname, router])

    if (maintenance && pathname !== '/maintenance' && checking) {
        // Show nothing while checking permission or redirecting
        return <div className="min-h-screen bg-black" />
    }

    return <>{children}</>
}
