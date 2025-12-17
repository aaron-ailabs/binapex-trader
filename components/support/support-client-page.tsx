"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Ticket, Search, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { LiveChatWidget } from "@/components/support/live-chat-widget"
import { SupportTicketList } from "@/components/support/support-ticket-list"
import { FAQSection } from "@/components/support/faq-section"
import { TicketModalTrigger } from "@/components/support/ticket-modal-trigger"

interface SupportClientPageProps {
  user: any
  profile: any
  tickets: any[] | null
}

export function SupportClientPage({ user, profile, tickets }: SupportClientPageProps) {
  const openTickets = tickets?.filter((t) => t.status === "open" || t.status === "in_progress").length || 0
  const resolvedTickets = tickets?.filter((t) => t.status === "resolved" || t.status === "closed").length || 0

  return (
    <DashboardLayout>
      <LiveChatWidget />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold text-balance">How can we help you?</h1>
          <p className="text-gray-400 text-lg">Search our knowledge base or get in touch with support</p>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, FAQs, guides..."
              className="pl-12 h-14 bg-black/50 border-white/10 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Live Chat Button */}
          <GlassCard className="p-6 hover:border-[#F59E0B]/50 transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <MessageCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Live Chat Support</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Get instant help from our support team. Available 24/7 for all your questions.
                </p>
                <Button
                  onClick={() => {
                    if ((window as any).Tawk_API) {
                      ;(window as any).Tawk_API.maximize()
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Start Live Chat
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Open Ticket Button */}
          <TicketModalTrigger userId={user.id}>
            {(openModal: () => void) => (
              <GlassCard
                onClick={openModal}
                className="p-6 hover:border-[#F59E0B]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F59E0B]/10 group-hover:bg-[#F59E0B]/20 transition-colors">
                    <Ticket className="h-6 w-6 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Open a Ticket</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Submit a detailed support request and our team will get back to you within 24 hours.
                    </p>
                    <Button className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-bold">
                      Create Ticket
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}
          </TicketModalTrigger>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-white">{tickets?.length || 0}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Open Tickets</p>
                <p className="text-2xl font-bold text-white">{openTickets}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-white">{resolvedTickets}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* FAQ and Ticket List */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <FAQSection />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Your Support Tickets</h2>
            <SupportTicketList tickets={tickets || []} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
