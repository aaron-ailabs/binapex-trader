"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [checking, setChecking] = useState(true)
    const [maintenance, setMaintenance] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // 1. Check Maintenance Setting
                const { data: settings, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'maintenance_mode')
                    .single()

                if (error && error.code !== 'PGRST116') { // Ignore "Row not found" (PGRST116) as it's not a maintenance state
                    console.warn('Maintenance check failed, assuming active', error.message)
                }

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
            } catch (err) {
                console.error('Maintenance Guard Critical Error:', err)
            } finally {
                setChecking(false)
            }
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
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime subscription error for maintenance_guard')
                }
            })

        return () => { supabase.removeChannel(channel) }
    }, [pathname, router, supabase])

    if (maintenance && pathname !== '/maintenance' && checking) {
        // Show nothing while checking permission or redirecting
        return <div className="min-h-screen bg-black" />
    }

    return <>{children}</>
}
