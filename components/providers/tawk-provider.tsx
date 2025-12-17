"use client"

import type React from "react"
import { useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

interface TawkProviderProps {
  propertyId: string
  widgetId: string
  children: React.ReactNode
}

export function TawkProvider({ propertyId, widgetId, children }: TawkProviderProps) {
  const pathname = usePathname()
  const initAttemptedRef = useRef(false)
  const tawkScriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (!propertyId || !widgetId) {
      console.warn("[Tawk] Missing propertyId or widgetId, skipping Tawk initialization")
      return
    }

    const isLoginPage =
      pathname?.includes("/login") || pathname?.includes("/admin/login") || pathname?.includes("/auth")

    // Only load Tawk on dashboard, admin, and support routes
    // Explicitly exclude login pages unless on support (which might require auth, but if public, allow it)
    const shouldShowTawk = 
      pathname?.startsWith("/dashboard") || 
      (pathname?.startsWith("/admin") && !isLoginPage) ||
      pathname?.startsWith("/support")
    
    if (!shouldShowTawk) {
      return
    }

    if (initAttemptedRef.current) {
      return
    }
    initAttemptedRef.current = true

    try {
      const s1 = document.createElement("script")
      s1.async = true
      s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
      s1.charset = "UTF-8"
      s1.setAttribute("crossorigin", "*")

      s1.onerror = () => {
        // Silently ignore errors to prevent re-render loops
      }

      s1.onload = () => {
        // Wait for Tawk_API to be available
        let attempts = 0
        const checkTawkReady = setInterval(() => {
          if (window.Tawk_API && window.Tawk_API.onLoad) {
            window.Tawk_API.onLoad()
            clearInterval(checkTawkReady)
          }
          attempts++
          if (attempts > 50) {
            clearInterval(checkTawkReady)
          }
        }, 100)
      }

      tawkScriptRef.current = s1
      document.head.appendChild(s1)

      return () => {
        // Cleanup script when route changes
        if (tawkScriptRef.current && document.head.contains(tawkScriptRef.current)) {
          document.head.removeChild(tawkScriptRef.current)
        }
        initAttemptedRef.current = false
      }
    } catch (error) {
      // Silently ignore errors
      initAttemptedRef.current = false
    }
  }, [pathname, propertyId, widgetId])

  return <>{children}</>
}

// Hook for using Tawk API
export function useTawk() {
  const openChat = useCallback(() => {
    if (typeof window !== "undefined" && window.Tawk_API?.maximize) {
      window.Tawk_API.maximize()
    }
  }, [])

  const closeChat = useCallback(() => {
    if (typeof window !== "undefined" && window.Tawk_API?.minimize) {
      window.Tawk_API.minimize()
    }
  }, [])

  const toggleChat = useCallback(() => {
    if (typeof window !== "undefined" && window.Tawk_API?.toggle) {
      window.Tawk_API.toggle()
    }
  }, [])

  const setUserInfo = useCallback((name: string, email: string) => {
    if (typeof window !== "undefined" && window.Tawk_API?.setAttributes) {
      window.Tawk_API.setAttributes(
        {
          name: name,
          email: email,
        },
        () => {},
      )
    }
  }, [])

  const trackEvent = useCallback((eventName: string) => {
    if (typeof window !== "undefined" && window.Tawk_API?.track) {
      window.Tawk_API.track(eventName)
    }
  }, [])

  return { openChat, closeChat, toggleChat, setUserInfo, trackEvent }
}

// Declare Tawk API types
declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void
      minimize?: () => void
      toggle?: () => void
      setAttributes?: (attributes: Record<string, string>, callback: () => void) => void
      track?: (eventName: string) => void
      onLoad?: () => void
      onStatusChange?: (status: string) => void
    }
    Tawk_LoadStart?: Date
  }
}
