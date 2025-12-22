"use client"

import { useState, useEffect, useRef } from "react"
import { Send, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender_role: "user" | "admin"
  created_at: string
  user_id: string
}

interface AdminChatWindowProps {
  selectedUserId: string | null
  onBack?: () => void
}

export function AdminChatWindow({ selectedUserId, onBack }: AdminChatWindowProps) {
  const { user: currentUser } = useAuth() // Only used to verify auth, though sender_role is hardcoded 'admin'
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUserId) {
        setMessages([])
        return
    }

    const fetchMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", selectedUserId)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setMessages(data as Message[])
      }
      setIsLoading(false)
    }

    fetchMessages()

    // Realtime subscription for THIS user's chat
    const channel = supabase
      .channel(`admin_chat_${selectedUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${selectedUserId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUserId, supabase])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId) return

    const content = newMessage.trim()
    setNewMessage("")

    const { error } = await supabase.from("support_messages").insert({
      user_id: selectedUserId, // IMPORTANT: The CUSTOMER'S ID, not the Admin's ID
      content: content,
      sender_role: "admin",
    })

    if (error) {
      console.error("Failed to send reply:", error)
      // Restore message if needed
    }
  }

  if (!selectedUserId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-500">
        <p>Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 p-4 flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-zinc-400 hover:text-white"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-200 truncate">Chat with User</h3>
          <p className="text-xs text-zinc-500 font-mono truncate">{selectedUserId}</p>
        </div>
      </div>

      {/* Message List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
           {isLoading ? (
               <div className="flex justify-center p-4">
                   <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
               </div>
           ) : (
                messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex w-full",
                            msg.sender_role === "admin" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] px-4 py-2 text-sm shadow-sm",
                                msg.sender_role === "admin"
                                    ? "bg-amber-500 text-black rounded-2xl rounded-tr-none"
                                    : "bg-zinc-800 text-white rounded-2xl rounded-tl-none"
                            )}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))
           )}
           <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="bg-amber-500 text-black hover:bg-amber-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
