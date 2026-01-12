"use client"

import { useCallback } from 'react'

type SoundType = 'success' | 'warning' | 'error' | 'notification' | 'loss' | 'expiry'

export function useSoundEffects() {
    const play = useCallback((type: SoundType) => {
        try {
            // In a real app, you might want to check user preferences here
            const soundPaths: Record<SoundType, string> = {
                success: '/sounds/success.mp3',
                warning: '/sounds/warning.mp3',
                error: '/sounds/loss.mp3', // Reusing loss for error generic
                notification: '/sounds/notification.mp3',
                loss: '/sounds/loss.mp3',
                expiry: '/sounds/expiry.mp3'
            }

            const audio = new Audio(soundPaths[type])
            audio.volume = 0.5 // Default volume

            const playPromise = audio.play()

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Auto-play was prevented
                    console.log('Audio playback failed:', error)
                    // Interaction required usually
                })
            }
        } catch (error) {
            console.error('Failed to play sound:', error)
        }
    }, [])

    return { play }
}
