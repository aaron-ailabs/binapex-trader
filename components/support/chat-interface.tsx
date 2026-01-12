"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Paperclip, Check, CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Message {
  id: string
  content: string
  sender_role: "user" | "admin"
  created_at: string
  is_read: boolean
  attachment_url?: string
  attachment_type?: string
}

function ChatMessageAttachment({ path, type }: { path?: string, type?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!path) return

    async function fetchUrl() {
      const { data } = await supabase.storage
        .from("chat-attachments")
        .createSignedUrl(path!, 3600)

      if (data?.signedUrl) {
        setUrl(data.signedUrl)
      }
    }
    fetchUrl()
  }, [path, supabase])

  if (!path) return null
  if (!url) return <div className="h-48 w-48 animate-pulse rounded-lg bg-black/20" />

  return (
    <div className="mt-1 mb-1">
      <img
        src={url}
        alt="Attachment"
        className="max-h-60 max-w-full rounded-lg border border-black/10 object-contain cursor-pointer"
        onClick={() => window.open(url, '_blank')}
      />
    </div>
  )
}

export function ChatInterface({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch initial messages and subscribe to realtime updates
  useEffect(() => {
    if (!user) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setMessages(data as Message[])

        // Mark admin messages as read when we open the chat
        const unreadAdminMsgIds = (data as Message[])
          .filter(m => m.sender_role === 'admin' && !m.is_read)
          .map(m => m.id)

        if (unreadAdminMsgIds.length > 0) {
          await supabase.from("support_messages").update({ is_read: true }).in("id", unreadAdminMsgIds)
        }
      }
      setIsLoading(false)
    }

    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel("support_chat")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT and UPDATE (for read receipts)
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message])
            // If incoming is from admin, mark read immediately if window is open
            if ((payload.new as Message).sender_role === 'admin') {
              supabase.from("support_messages").update({ is_read: true }).eq('id', (payload.new as Message).id)
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new as Message : m))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const content = newMessage.trim()
    setNewMessage("")

    const { error } = await supabase.from("support_messages").insert({
      user_id: user.id,
      content: content,
      sender_role: "user",
    })

    if (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG, JPG)")
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { error: msgError } = await supabase.from("support_messages").insert({
        user_id: user.id,
        content: "Sent an image",
        sender_role: "user",
        attachment_url: fileName,
        attachment_type: file.type
      })

      if (msgError) throw msgError

    } catch (err) {
      console.error("Upload failed", err)
      alert("Failed to upload image")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#0b141a] min-h-0 relative">
      {/* WhatsApp Default Wallpaper Pattern Overlay */}
      <div className="absolute inset-0 bg-whatsapp-pattern" />

      {/* Header */}
      <div className="flex items-center justify-between bg-[#202c33] p-3 px-4 shadow-sm z-10 border-b border-[#202c33]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <img src="https://ui-avatars.com/api/?name=Support&background=10b981&color=fff" className="rounded-full" alt="Support" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#202c33]"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-100 font-medium leading-none">Binapex Support</span>
            <span className="text-xs text-zinc-400 mt-1">Online 24/7</span>
          </div>
        </div>

        {/* Header Close Button (Mobile Only) */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-[#2a3942]"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Message List */}
      <ScrollArea className="flex-1 p-0 overflow-hidden z-10">
        <div className="p-4 space-y-2 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center my-4">
              <div className="bg-[#1f2c34] text-amber-500 text-xs px-3 py-1.5 rounded-lg shadow-sm text-center max-w-[80%]">
                Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full mb-1",
                  msg.sender_role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative px-3 py-1.5 shadow-sm max-w-[80%] min-w-[100px] text-sm group break-words",
                    msg.sender_role === "user"
                      ? "bg-[#005c4b] text-[#e9edef] rounded-lg rounded-tr-none"
                      : "bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none"
                  )}
                >
                  {/* Tail Mockup using CSS borders or SVG would be ideal, using rounded corners for now */}

                  {msg.attachment_url && (
                    <ChatMessageAttachment path={msg.attachment_url} type={msg.attachment_type} />
                  )}

                  <div className="mr-8 pb-1">
                    {msg.content}
                  </div>

                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400 leading-none">
                      {format(new Date(msg.created_at), "HH:mm")}
                    </span>
                    {msg.sender_role === "user" && (
                      <span className={cn(
                        "text-[10px] leading-none",
                        msg.is_read ? "text-[#53bdeb]" : "text-zinc-500"
                      )}>
                        {msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-[#202c33] p-2 px-4 z-10 flex items-end gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="text-zinc-400 hover:text-zinc-300 hover:bg-transparent h-10 w-10 shrink-0"
        >
          {isUploading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" /> : <Paperclip className="h-5 w-5" />}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileUpload}
          aria-label="Upload attachment"
          title="Upload attachment"
        />

        <form onSubmit={handleSendMessage} className="flex-1 flex items-end gap-2 mb-1">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 border-none bg-[#2a3942] text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 rounded-lg min-h-[40px] py-2"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="bg-[#00a884] text-white hover:bg-[#008f6f] h-10 w-10 rounded-full shrink-0"
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
