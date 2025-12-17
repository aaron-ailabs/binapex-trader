"use client"

import { useEffect } from "react"

interface TawkChatProps {
  userEmail?: string
  userName?: string
}

export function TawkChat({ userEmail, userName }: TawkChatProps) {
  useEffect(() => {
    // Add Tawk.to script
    const script = document.createElement("script")
    script.async = true
    script.src = "https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID"
    script.charset = "UTF-8"
    script.setAttribute("crossorigin", "*")

    // Set visitor attributes
    if (userEmail || userName) {
      ;(window as any).Tawk_API = (window as any).Tawk_API || {}
      ;(window as any).Tawk_API.onLoad = () => {
        if (userEmail) {
          ;(window as any).Tawk_API.setAttributes(
            {
              name: userName || "",
              email: userEmail,
            },
            (error: any) => {
              if (error) console.error("[v0] Tawk.to setAttributes error:", error)
            },
          )
        }
      }
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector('script[src*="tawk.to"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [userEmail, userName])

  return null
}
