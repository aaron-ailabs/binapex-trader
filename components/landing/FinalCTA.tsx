"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-binapex-gold/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-binapex-gold/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                    Ready to Trade the <span className="text-binapex-gold">Future of Finance</span> from Malaysia?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    Join thousands of traders accessing global markets with institutional-grade security and speed.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" className="h-14 px-8 text-lg bg-binapex-gold text-binapex-dark hover:bg-binapex-gold-light w-full sm:w-auto" asChild>
                        <Link href="/signup">
                            Create Your Free Account
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto hover:bg-white/5" asChild>
                        <Link href="#markets">Explore the Platform</Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}
