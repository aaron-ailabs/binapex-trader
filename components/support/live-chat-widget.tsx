"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useTawk } from "@/components/providers/tawk-provider"

export function LiveChatWidget() {
  const { user } = useAuth()
  const { toggleChat, setUserInfo } = useTawk()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show widget button after a short delay
    const timer = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user && user.email) {
      const name = user.email.split("@")[0] || "User"
      setUserInfo(name, user.email)
    }
  }, [user, setUserInfo])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Open Support Chat</span>
      </Button>

      {user && (
        <div className="absolute -top-2 -right-2 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      )}
    </div>
  )
}
