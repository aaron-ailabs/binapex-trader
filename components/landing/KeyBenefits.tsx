"use client"

import { Zap, Shield, HeadphonesIcon, BarChart3, Scale, Globe } from "lucide-react"

const benefits = [
    {
        icon: Zap,
        title: "Zero Latency Execution",
        description:
            "Execute trades instantly on our low-latency infrastructure, optimized for high-frequency forex and stocks trading.",
    },
    {
        icon: Shield,
        title: "Bank-Grade Security",
        description:
            "Your assets are protected with secure online trading technology, cold storage, and bank-grade encryption.",
    },
    {
        icon: HeadphonesIcon,
        title: "24/7 Expert Support",
        description:
            "Get round-the-clock assistance from our dedicated support team, available for all Malaysian time zones.",
    },
    {
        icon: BarChart3,
        title: "Advanced Analytics",
        description: "Access professional charting tools and real-time market data to make informed trading decisions.",
    },
    {
        icon: Scale,
        title: "Regulated & Compliant",
        description:
            "Trade with confidence on a compliant crypto trading platform designed to meet global standards.",
    },
    {
        icon: Globe,
        title: "Global Markets",
        description:
            "Access over 500 markets including crypto, forex, stocks, and commodities from a single account in Malaysia.",
    },
]

export function KeyBenefits() {
    return (
        <section id="features" className="py-20 bg-white/5 border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Malaysian Traders Choose Binapex</h2>
                    <p className="text-muted-foreground text-lg">
                        Professional tools and infrastructure designed for both new and experienced traders.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-background/50 border border-white/10 hover:border-binapex-gold/50 transition-colors group"
                        >
                            <div className="h-12 w-12 rounded-lg bg-binapex-gold/10 flex items-center justify-center mb-6 group-hover:bg-binapex-gold/20 transition-colors">
                                <benefit.icon className="h-6 w-6 text-binapex-gold" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
