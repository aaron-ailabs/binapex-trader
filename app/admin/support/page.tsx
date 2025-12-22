"use client"

import { useState } from "react"
import { InboxList } from "@/components/admin/support/inbox-list"
import { AdminChatWindow } from "@/components/admin/support/admin-chat-window"

export default function AdminSupportPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-zinc-950 border border-zinc-800 m-4 rounded-xl shadow-2xl">
      {/* Left Sidebar: Inbox List (1/3 width) */}
      <div className="w-1/3 min-w-[300px] border-r border-zinc-800">
        <InboxList 
          onSelectUser={setSelectedUserId} 
          selectedUserId={selectedUserId} 
        />
      </div>

      {/* Right Panel: Chat Window (2/3 width) */}
      <div className="w-2/3 flex-1 bg-zinc-950">
        <AdminChatWindow selectedUserId={selectedUserId} />
      </div>
    </div>
  )
}
