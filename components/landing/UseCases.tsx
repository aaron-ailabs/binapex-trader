"use client"

import { CheckCircle2 } from "lucide-react"

const personas = [
    {
        title: "For Day Traders",
        features: ["Fast execution", "Tight spreads", "Real-time charts", "24/7 markets"],
    },
    {
        title: "For Algorithmic & API Traders",
        features: ["Stable API Access", "Low-latency infrastructure", "Transparent data feeds", "Sandbox & demo environment"],
    },
    {
        title: "For Long-Term Investors",
        features: ["Diversified global markets", "Portfolio overview", "Advanced risk tools", "Secure asset custody"],
    },
]

export function UseCases() {
    return (
        <section className="py-20 bg-white/5 border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Every Serious Trader</h2>
                    <p className="text-muted-foreground text-lg">
                        Whether you scalp the markets or invest for the long term, Binapex adapts to your style.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {personas.map((persona, index) => (
                        <div
                            key={index}
                            className="p-8 rounded-2xl bg-background border border-white/10 hover:border-binapex-gold/30 transition-all hover:translate-y-[-4px]"
                        >
                            <h3 className="text-2xl font-bold mb-6 text-binapex-gold">{persona.title}</h3>
                            <ul className="space-y-4">
                                {persona.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-binapex-gold shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
