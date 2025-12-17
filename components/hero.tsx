import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-binapex-gold/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-binapex-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-binapex-gold"></span>
            </span>
            <span className="text-muted-foreground">Live trading across 500+ markets</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance">
            Trade the Future of{" "}
            <span className="bg-gradient-to-r from-binapex-gold via-binapex-gold to-binapex-gold-dark bg-clip-text text-transparent">
              Finance
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Professional tools for trading Crypto, Forex, Stocks, and Commodities. Bank-grade security meets
            zero-latency execution.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              asChild
              className="bg-binapex-gold hover:bg-binapex-gold-dark text-binapex-dark font-semibold text-base h-12 px-8"
            >
              <Link href="/signup">
                Start Trading Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/20 hover:bg-white/5 text-foreground h-12 px-8 bg-transparent"
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-binapex-gold" />
              <span>Zero Latency</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-binapex-gold" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-binapex-gold" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
