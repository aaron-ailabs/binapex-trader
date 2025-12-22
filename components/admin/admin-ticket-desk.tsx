"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { MessageSquare, ExternalLink, Send } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLiveData } from "@/hooks/use-live-data"

interface AdminTicketDeskProps {
  tickets: any[]
}

export function AdminTicketDesk({ tickets: initialTickets }: AdminTicketDeskProps) {
  const router = useRouter()
  const supabase = createClient()
  const tickets = useLiveData("tickets", initialTickets, { column: "created_at", ascending: false })
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTickets = tickets.filter((ticket: any) => {
    const statusMatch = filterStatus === "all" || ticket.status === filterStatus
    const searchMatch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return statusMatch && searchMatch
  })

  const handleRespond = async () => {
    if (!response.trim() || !selectedTicket) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          admin_response: response,
          status: "resolved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id)

      if (error) throw error

      // Log admin action
      await supabase.from("admin_logs").insert({
        action: "responded_to_ticket",
        target_user_id: selectedTicket.user_id,
        details: { ticket_id: selectedTicket.id, response },
      })

      toast.success("Response sent successfully")
      setResponse("")
      setSelectedTicket(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to send response")
    } finally {
      setIsSubmitting(false)
    }
  }



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
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "medium":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
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

  return (
    <div className="space-y-6">


      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm bg-black/50 border-white/10"
        />
        <div className="flex gap-2">
          {["all", "open", "in_progress", "resolved", "closed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={
                filterStatus === status ? "bg-[#F59E0B] text-black" : "border-white/10 bg-transparent hover:bg-white/5"
              }
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-gray-400">No tickets found</p>
            </GlassCard>
          ) : (
            filteredTickets.map((ticket: any) => (
              <GlassCard
                key={ticket.id}
                className={`p-4 cursor-pointer transition-all ${selectedTicket?.id === ticket.id ? "border-[#F59E0B] border-2" : "hover:border-white/20"}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{ticket.subject}</h4>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {ticket.profiles?.full_name || "Unknown"} • {format(new Date(ticket.created_at), "MMM dd")}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge variant="outline" className={getCategoryColor(ticket.category)}>
                      {ticket.category}
                    </Badge>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {!selectedTicket ? (
            <GlassCard className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Select a ticket to view details</p>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{selectedTicket.subject}</h3>
                  <Badge variant="outline" className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{selectedTicket.profiles?.full_name || "Unknown User"}</span>
                  <span>•</span>
                  <span>{selectedTicket.profiles?.email}</span>
                  <span>•</span>
                  <span>{format(new Date(selectedTicket.created_at), "MMM dd, yyyy HH:mm")}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge variant="outline" className={getCategoryColor(selectedTicket.category)}>
                    {selectedTicket.category}
                  </Badge>
                </div>
              </div>

              {/* Message */}
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">User Message:</p>
                <p className="text-white whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Attachment */}
              {selectedTicket.attachment_url && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Attachment:</p>
                  <a
                    href={selectedTicket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img
                      src={selectedTicket.attachment_url || "/placeholder.svg"}
                      alt="Attachment"
                      className="max-w-sm rounded-lg border border-white/10 hover:border-[#F59E0B]/50 transition-colors cursor-pointer"
                    />
                  </a>
                </div>
              )}

              {/* Previous Response */}
              {selectedTicket.admin_response && (
                <div className="bg-[#F59E0B]/5 p-4 rounded-lg border border-[#F59E0B]/20">
                  <p className="text-sm text-[#F59E0B] font-medium mb-2">Previous Response:</p>
                  <p className="text-white whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                  {selectedTicket.responded_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(selectedTicket.responded_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                </div>
              )}

              {/* Response Form */}
              {selectedTicket.status !== "closed" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Your Response:</p>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="bg-black/50 border-white/10 resize-none"
                  />
                  <Button
                    onClick={handleRespond}
                    disabled={isSubmitting || !response.trim()}
                    className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Response & Mark Resolved"}
                  </Button>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
