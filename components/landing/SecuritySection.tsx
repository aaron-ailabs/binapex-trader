"use client"

import { ShieldCheck, Lock, Smartphone, FileSearch } from "lucide-react"

export function SecuritySection() {
    return (
        <section className="py-20 bg-binapex-darker border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Institutional-Grade Security & Compliance</h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            We prioritize the safety of your funds and data with bank-grade security protocols and operational
                            compliance.
                        </p>

                        <div className="space-y-6">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: "Bank-Grade Encryption",
                                    text: "Your data is protected by advanced encryption standards and hardened infrastructure.",
                                },
                                {
                                    icon: Lock,
                                    title: "Secure Cold Storage",
                                    text: "The majority of client digital assets are held in offline cold storage facilities.",
                                },
                                {
                                    icon: Smartphone,
                                    title: "Two-Factor Authentication",
                                    text: "Mandatory 2FA adds an extra layer of protection to every account access and withdrawal.",
                                },
                                {
                                    icon: FileSearch,
                                    title: "Monitoring & Fraud Detection",
                                    text: "Continuous monitoring systems to detect and prevent unauthorized activities.",
                                },
                            ].map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <item.icon className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-binapex-gold/20 blur-[100px] rounded-full" />
                        <div className="relative bg-gradient-to-br from-white/10 to-transparent p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="bg-binapex-dark rounded-xl p-8 space-y-6">
                                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Security Status</div>
                                        <div className="text-green-500 font-bold flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            Operational
                                        </div>
                                    </div>
                                    <ShieldCheck className="h-8 w-8 text-binapex-gold" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Encryption</span>
                                        <span className="font-mono text-green-500">AES-256</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Assets in Cold Storage</span>
                                        <span className="font-mono text-green-500">98%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">2FA Enabled</span>
                                        <span className="font-mono text-green-500">Required</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Last Audit</span>
                                        <span className="font-mono text-green-500">Passed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
