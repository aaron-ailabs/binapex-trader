"use client"

import { MessageCircle, Clock, CheckCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { toast } from "sonner"

const faqs = [
  {
    question: "How do I place a trade?",
    category: "Trading Basics",
  },
  {
    question: "What are the trading fees?",
    category: "Fees & Pricing",
  },
  {
    question: "How do I withdraw funds?",
    category: "Withdrawals",
  },
  {
    question: "Is my account secure?",
    category: "Security",
  },
  {
    question: "What are the minimum deposits?",
    category: "Account",
  },
  {
    question: "How do I enable 2FA?",
    category: "Security",
  },
]

export default function LiveChatClient() {
  const openChat = () => {
     toast.info("Please use the support widget in the bottom right corner.")
  }

  const handleFaqClick = () => {
    openChat()
  }

  return (
    <main className="min-h-screen bg-binapex-dark p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Live Support</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-binapex-gold to-binapex-gold-dark rounded-full"></div>
          <p className="mt-4 text-lg text-muted-foreground">Get instant help from our support team</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Avg Response Time */}
          <GlassCard className="flex flex-col items-center justify-center p-6">
            <Clock className="mb-3 h-8 w-8 text-binapex-gold" />
            <p className="text-center text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-2xl font-bold text-foreground">{"<2 min"}</p>
          </GlassCard>

          {/* Support Status */}
          <GlassCard className="flex flex-col items-center justify-center p-6">
            <CheckCircle className="mb-3 h-8 w-8 text-success" />
            <p className="text-center text-sm text-muted-foreground">Support Status</p>
            <p className="text-2xl font-bold text-success">Online</p>
          </GlassCard>

          {/* 24/7 Support */}
          <GlassCard className="flex flex-col items-center justify-center p-6">
            <Shield className="mb-3 h-8 w-8 text-binapex-gold" />
            <p className="text-center text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-foreground">24/7</p>
          </GlassCard>
        </div>

        {/* Main Chat Card */}
        <div className="mb-12">
          <GlassCard className="overflow-hidden">
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <MessageCircle className="mb-4 h-16 w-16 text-binapex-gold" />
              <h2 className="mb-2 text-3xl font-bold text-foreground">Need Help?</h2>
              <p className="mb-8 max-w-md text-muted-foreground">
                Our support team is here to assist you with any questions or issues you may encounter.
              </p>
              <Button
                onClick={openChat}
                className="bg-gradient-to-r from-binapex-gold to-binapex-gold-dark text-primary-foreground hover:from-binapex-gold-dark hover:to-binapex-gold font-semibold px-8 py-6 text-lg rounded-lg transition-all"
              >
                Start Live Chat
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* FAQ Quick Links */}
        <div>
          <h3 className="mb-6 text-2xl font-bold text-foreground">FAQ Quick Links</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <button key={index} onClick={handleFaqClick} className="group text-left">
                <GlassCard className="h-full p-4 transition-all hover:border-binapex-gold hover:bg-opacity-20 group-hover:bg-opacity-30">
                  <p className="mb-1 text-sm text-muted-foreground">{faq.category}</p>
                  <p className="font-semibold text-foreground group-hover:text-binapex-gold transition-colors">
                    {faq.question}
                  </p>
                </GlassCard>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
