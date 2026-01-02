"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react"

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
            {/* Background gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-binapex-gold/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-binapex-gold/10 border border-binapex-gold/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="flex h-2 w-2 rounded-full bg-binapex-gold animate-pulse"></span>
                        <span className="text-sm font-medium text-binapex-gold">Trade the Future of Finance, From Malaysia</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-5 duration-700">
                        Trade 500+ Global Markets <br className="hidden md:block" />
                        <span className="text-foreground">from Malaysia</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-900">
                        Binapex is a professional multi-asset trading platform built for Malaysian traders. Access crypto, forex,
                        stocks, and commodities with ultra-low latency, bank-grade security, and MYR-friendly funding options.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-7 duration-1000">
                        <Button size="lg" className="h-12 px-8 text-base bg-binapex-gold text-binapex-dark hover:bg-binapex-gold-light w-full sm:w-auto" asChild>
                            <Link href="/signup">
                                Start Trading in 3 Minutes
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto hover:bg-white/5" asChild>
                            <Link href="#demo">Try Demo Platform</Link>
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-binapex-gold" />
                            <span>Zero Latency Execution</span>
                        </div>
                        <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-binapex-gold" />
                            <span>Bank-Grade Security</span>
                        </div>
                        <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-binapex-gold" />
                            <span>24/7 Local & Global Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
