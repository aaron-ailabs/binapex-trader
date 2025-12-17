import { GlassCard } from "@/components/ui/glass-card"
import { Zap, Shield, Clock, TrendingUp, Lock, Globe } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Zero Latency Execution",
    description: "Lightning-fast order execution with our advanced matching engine. Trade at institutional speed.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Multi-layer security infrastructure with cold storage, 2FA, and insurance coverage up to $500M.",
  },
  {
    icon: Clock,
    title: "24/7 Expert Support",
    description: "Round-the-clock professional support from our dedicated trading specialists.",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    description: "Professional charting tools with 50+ technical indicators and real-time market insights.",
  },
  {
    icon: Lock,
    title: "Regulated & Compliant",
    description: "Fully licensed and regulated in multiple jurisdictions for your peace of mind.",
  },
  {
    icon: Globe,
    title: "Global Markets",
    description: "Access 500+ markets including crypto, forex, stocks, and commodities from one platform.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Professional Trading, <span className="text-binapex-gold">Simplified</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Everything you need to trade like a professional, all in one powerful platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <GlassCard key={feature.title} hover className="group">
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-binapex-gold/10 border border-binapex-gold/20 group-hover:bg-binapex-gold/20 transition-colors">
                    <Icon className="h-6 w-6 text-binapex-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
