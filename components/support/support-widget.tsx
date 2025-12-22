"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "./chat-interface"
import { cn } from "@/lib/utils"

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chat Window Container */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[350px] h-[500px] transition-all duration-300 ease-in-out origin-bottom-right shadow-2xl rounded-2xl overflow-hidden",
          isOpen
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-4 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <ChatInterface />
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105",
          isOpen ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-amber-500 text-black hover:bg-amber-400"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle Support Chat</span>
      </Button>
    </>
  )
}
