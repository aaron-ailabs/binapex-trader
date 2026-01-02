"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "What markets can I trade on Binapex?",
        answer:
            "Binapex offers access to over 500 global markets including major cryptocurrencies (Bitcoin, Ethereum), Forex pairs (major, minor, exotic), Global Stocks (US, EU, Asia), and Commodities (Gold, Oil, Silver) - all from a single account.",
    },
    {
        question: "Is Binapex available for Malaysian residents?",
        answer:
            "Yes, Binapex is fully available for Malaysian traders. We provide localized support and ensuring a seamless trading experience optimized for the region.",
    },
    {
        question: "Is Binapex regulated and secure?",
        answer:
            "Security is our top priority. We employ bank-grade encryption, cold storage for digital assets, and mandatory 2FA. We adhere to strict compliance standards to ensure a safe trading environment.",
    },
    {
        question: "What are the trading fees?",
        answer:
            "We offer competitive, transparent pricing with tight spreads. There are no hidden fees for deposits. Detailed fee schedules for different asset classes are available on our trading conditions page.",
    },
    {
        question: "Does Binapex support API and algorithmic trading?",
        answer:
            "Absolutely. We provide a robust, low-latency API for algorithmic traders, supporting both REST and WebSocket connections for real-time market data and automated trade execution.",
    },
    {
        question: "Is there a demo or paper trading account?",
        answer:
            "Yes, you can open a free demo account to practice your strategies with virtual funds before trading with real capital. It's the perfect way to get familiar with our platform.",
    },
    {
        question: "How do I deposit and withdraw funds in MYR?",
        answer:
            "We support various funding methods including crypto transfers and P2P options. We are constantly expanding our payment gateways to provide convenient local funding options for our Malaysian clients.",
    },
    {
        question: "How fast is order execution?",
        answer:
            "Our matching engine is built for speed, offering ultra-low latency execution to ensure you get the best possible price, which is crucial for high-frequency strategies and volatile markets.",
    },
]

export function FAQ() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground text-lg">
                        Find answers to common questions about trading with Binapex.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                            <AccordionTrigger className="text-left hover:text-binapex-gold transition-colors text-lg">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
