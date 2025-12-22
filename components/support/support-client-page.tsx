"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { FAQSection } from "@/components/support/faq-section"

interface SupportClientPageProps {
  user: any
  profile: any
}

export function SupportClientPage({ user, profile }: SupportClientPageProps) {
  return (
    <DashboardLayout>
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
                   toast.info("Please use the support widget in the bottom right corner.")
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Start Live Chat
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <FAQSection />
        </div>
      </div>
    </DashboardLayout>
  )
}
