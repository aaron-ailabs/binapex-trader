"use client"

import { useState } from "react"
import { Send, X, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ChatWindow({ onClose }: { onClose?: () => void }) {
  const [message, setMessage] = useState("")

  return (
    <div className="flex h-full flex-col bg-zinc-900/95 backdrop-blur-md rounded-lg overflow-hidden border border-amber-500/20 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-amber-500/50">
            <AvatarImage src="/support-avatar.png" />
            <AvatarFallback className="bg-amber-500 text-black font-bold">SP</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-bold text-white">Support Team</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </span>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 mt-1 border border-amber-500/50">
              <AvatarFallback className="bg-amber-500 text-black font-bold text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-tl-none bg-zinc-800 p-3 text-sm text-zinc-200 shadow-sm border border-white/5">
              <p>Hello! How can we help you today with your trading account?</p>
              <span className="mt-1 block text-[10px] text-zinc-500 text-right">Just now</span>
            </div>
          </div>
          
          {/* Example User Message */}
           {/* 
           <div className="flex items-start justify-end gap-3">
            <div className="rounded-2xl rounded-tr-none bg-amber-500 p-3 text-sm text-black shadow-sm font-medium">
              <p>I have a question about withdrawal.</p>
              <span className="mt-1 block text-[10px] text-black/60 text-right">Just now</span>
            </div>
           </div>
           */}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-white/10 bg-black/40 p-4">
        <form
          className="relative flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setMessage("")
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-amber-500 shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border-none bg-transparent px-0 text-sm focus-visible:ring-0 placeholder:text-zinc-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim()}
            className="h-8 w-8 shrink-0 rounded-full bg-amber-500 text-black hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
