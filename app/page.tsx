import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Ticker } from "@/components/ticker"
import { Hero } from "@/components/landing/Hero"
import { KeyBenefits } from "@/components/landing/KeyBenefits"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { UseCases } from "@/components/landing/UseCases"
import { MarketsOverview } from "@/components/landing/MarketsOverview"
import { SecuritySection } from "@/components/landing/SecuritySection"
import { Testimonials } from "@/components/landing/Testimonials"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Binapex | Multi-Asset Crypto, Forex, Stocks & Commodities Trading Platform in Malaysia",
  description:
    "Binapex is a professional multi-asset trading platform built for Malaysian traders. Login to trade crypto, forex, stocks, and commodities with bank-grade security and ultra-low latency.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-binapex-dark text-foreground selection:bg-binapex-gold/30">
      <Navbar />
      <Ticker />
      <main className="flex flex-col">
        <Hero />
        <KeyBenefits />
        <HowItWorks />
        <UseCases />
        <MarketsOverview />
        <SecuritySection />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
