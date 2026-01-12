import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type SoundType = 'warning' | 'expiry' | 'success' | 'loss'

export function useSound() {
    const [enabled, setEnabled] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                supabase.from('profiles').select('sound_enabled').eq('id', data.user.id).single()
                    .then(({ data: profile }) => {
                        if (profile) setEnabled(profile.sound_enabled)
                    })
            }
        })
    }, [])

    const play = (type: SoundType) => {
        if (!enabled) return

        // In a real browser environment, we create Audio objects
        // We catch errors because user interaction is required first usually, or file missing
        try {
            const audio = new Audio(`/sounds/${type}.mp3`)
            audio.volume = 0.5
            audio.play().catch(e => console.warn("Audio play blocked or failed:", e))
        } catch (e) {
            console.warn("Audio initialization failed", e)
        }
    }

    return { play, enabled }
}
