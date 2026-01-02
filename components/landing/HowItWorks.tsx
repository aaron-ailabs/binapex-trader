"use client"

import { UserPlus, Wallet, TrendingUp } from "lucide-react"

const steps = [
    {
        icon: UserPlus,
        title: "Create your Binapex account",
        description: "Sign up with your email, verify your identity, and secure your account in minutes.",
    },
    {
        icon: Wallet,
        title: "Fund and secure your account",
        description: "Deposit in MYR or supported currencies, enable 2FA, and manage your funds safely.",
    },
    {
        icon: TrendingUp,
        title: "Trade 500+ global markets",
        description: "Access crypto, forex, stocks, and commodities in one platform with ultra-low latency.",
    },
]

export function HowItWorks() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Trading in 3 Simple Steps</h2>
                    <p className="text-muted-foreground text-lg">
                        Join thousands of traders and start your journey with Binapex today.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />

                    {steps.map((step, index) => (
                        <div key={index} className="relative flex flex-col items-center text-center">
                            <div className="h-24 w-24 rounded-full bg-binapex-dark border border-white/10 flex items-center justify-center mb-6 z-10 relative">
                                <div className="absolute inset-0 rounded-full bg-binapex-gold/5 animate-pulse" />
                                <step.icon className="h-10 w-10 text-binapex-gold" />
                                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-binapex-gold text-binapex-dark font-bold flex items-center justify-center border-4 border-binapex-dark">
                                    {index + 1}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground max-w-xs">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
