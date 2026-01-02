"use client"

import { Bitcoin, Banknote, Building2, Droplets } from "lucide-react"

const markets = [
    {
        icon: Bitcoin,
        title: "Crypto",
        description: "Trade BTC, ETH, SOL, and major altcoins with high liquidity.",
        items: ["Bitcoin", "Ethereum", "Solana", "Ripple", "USDT"],
    },
    {
        icon: Banknote,
        title: "Forex",
        description: "Access major, minor, and exotic currency pairs.",
        items: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/MYR", "AUD/USD"],
    },
    {
        icon: Building2,
        title: "Stocks",
        description: "Invest in top global companies and blue-chip stocks.",
        items: ["Apple", "Tesla", "NVIDIA", "Microsoft", "Amazon"],
    },
    {
        icon: Droplets,
        title: "Commodities",
        description: "Diversify with hard and soft commodities.",
        items: ["Gold (XAU)", "Silver (XAG)", "Crude Oil", "Natural Gas"],
    },
]

export function MarketsOverview() {
    return (
        <section id="markets" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Trade 500+ Global Markets in One Platform</h2>
                    <p className="text-muted-foreground text-lg">
                        Manage a diversified portfolio from a single account. Trade crypto, forex, stocks, and commodities seamlessly
                        from Malaysia.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {markets.map((market, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:border-binapex-gold/30 transition-colors group"
                        >
                            <div className="h-12 w-12 rounded-lg bg-binapex-gold/10 flex items-center justify-center mb-6 group-hover:bg-binapex-gold/20 transition-colors">
                                <market.icon className="h-6 w-6 text-binapex-gold" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{market.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{market.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {market.items.map((item, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 rounded-md bg-white/5 text-muted-foreground">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
