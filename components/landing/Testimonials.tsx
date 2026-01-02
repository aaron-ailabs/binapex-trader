"use client"

import { Quote } from "lucide-react"

const testimonials = [
    {
        name: "Ahmad",
        role: "Day Trader",
        content:
            "Execution speed is critical for my strategy. Binapex delivers zero latency exactly as promised. It's the best platform I've used in Malaysia.",
    },
    {
        name: "Lim",
        role: "Crypto Swing Trader",
        content:
            "I love that I can trade both crypto and global stocks in one place. The charts are professional grade and the fees are very competitive.",
    },
    {
        name: "Sara",
        role: "Part-Time Investor",
        content:
            "As a beginner, I found the interface very intuitive. Customer support helped me set up my account quickly. Highly recommended!",
    },
]

export function Testimonials() {
    return (
        <section className="py-20 bg-white/5 border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Traders Across Malaysia and Beyond</h2>
                    <p className="text-muted-foreground text-lg">See what our community has to say about their trading experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div key={index} className="p-8 rounded-2xl bg-background border border-white/10 relative">
                            <Quote className="absolute top-8 right-8 h-8 w-8 text-binapex-gold/20" />
                            <div className="mb-6 h-12 w-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-xl font-bold">
                                {item.name[0]}
                            </div>
                            <p className="text-lg mb-6 leading-relaxed">"{item.content}"</p>
                            <div>
                                <div className="font-bold">{item.name}</div>
                                <div className="text-sm text-binapex-gold">{item.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
