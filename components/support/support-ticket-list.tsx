"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Paperclip } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  user_id: string
  subject: string
  category: string
  message: string
  status: string
  priority: string
  attachment_url: string | null
  admin_response: string | null
  responded_by: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

interface SupportTicketListProps {
  tickets: Ticket[]
}

export function SupportTicketList({ tickets }: SupportTicketListProps) {
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "resolved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-gray-400"
      case "medium":
        return "text-blue-400"
      case "high":
        return "text-orange-400"
      case "urgent":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "verification":
        return "bg-purple-500/10 text-purple-400"
      case "deposit":
        return "bg-emerald-500/10 text-emerald-400"
      case "withdrawal":
        return "bg-blue-500/10 text-blue-400"
      case "technical":
        return "bg-orange-500/10 text-orange-400"
      default:
        return "bg-gray-500/10 text-gray-400"
    }
  }

  if (tickets.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <p className="text-gray-400">No support tickets yet</p>
        <p className="text-sm text-gray-500 mt-2">Submit a ticket if you need help</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Your Tickets</h3>
      {tickets.map((ticket) => (
        <GlassCard key={ticket.id} className="p-4">
          <div
            className="flex justify-between items-start cursor-pointer"
            onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h4 className="font-bold text-white">{ticket.subject}</h4>
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={getCategoryColor(ticket.category)}>
                  {ticket.category}
                </Badge>
                <span className={cn("text-xs font-medium uppercase", getPriorityColor(ticket.priority))}>
                  {ticket.priority}
                </span>
                {ticket.attachment_url && <Paperclip className="h-4 w-4 text-gray-400" />}
              </div>
              <p className="text-sm text-gray-400">{format(new Date(ticket.created_at), "MMM dd, yyyy HH:mm")}</p>
            </div>
            {expandedTicket === ticket.id ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {expandedTicket === ticket.id && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Your Message:</p>
                <p className="text-sm text-white whitespace-pre-wrap">{ticket.message}</p>
              </div>

              {ticket.attachment_url && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Attachment:</p>
                  <a
                    href={ticket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={ticket.attachment_url || "/placeholder.svg"}
                      alt="Ticket attachment"
                      className="max-w-sm rounded-lg border border-white/10 hover:border-[#F59E0B]/50 transition-colors cursor-pointer"
                    />
                  </a>
                </div>
              )}

              {ticket.admin_response && (
                <div className="bg-[#F59E0B]/5 p-4 rounded-lg border border-[#F59E0B]/20">
                  <p className="text-sm text-[#F59E0B] font-medium mb-2">Support Response:</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{ticket.admin_response}</p>
                  {ticket.responded_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Responded on {format(new Date(ticket.responded_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                </div>
              )}
              {!ticket.admin_response && ticket.status === "open" && (
                <p className="text-sm text-gray-500 italic">Waiting for support response...</p>
              )}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  )
}
