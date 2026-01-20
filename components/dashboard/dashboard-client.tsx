"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { StatCard } from "@/components/dashboard/stat-card"
import { DataTable } from "@/components/ui/data-table"
import { GlassCard } from "@/components/ui/glass-card"
import { DollarSign, TrendingUp, Activity, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Asset, Profile } from "@/lib/types/database"
import { CreditScoreCard } from "@/components/dashboard/credit-score-card"
import { GeoUpdater } from "@/components/dashboard/geo-updater"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { AllocationChart } from "@/components/dashboard/allocation-chart"
import { toast } from "sonner"

interface DashboardClientProps {
    initialProfile: Profile | null
    initialBalance: number
    initialAssets: Asset[]
    initialPortfolio: any[]
    userEmail: string
}

export function DashboardClient({
    initialProfile,
    initialBalance,
    initialAssets,
    initialPortfolio,
    userEmail,
}: DashboardClientProps) {
    const supabase = createClient()
    const [assets, setAssets] = useState<Asset[]>(initialAssets)
    const [portfolio, setPortfolio] = useState<any[]>(initialPortfolio)
    const [balance, setBalance] = useState(initialBalance)

    useEffect(() => {
        // Subscribe to Asset Price Updates
        const channel = supabase
            .channel("realtime-assets")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "assets",
                },
                (payload) => {
                    const updatedAsset = payload.new as Asset
                    setAssets((currentAssets) =>
                        currentAssets.map((asset) =>
                            asset.id === updatedAsset.id ? { ...asset, ...updatedAsset } : asset
                        )
                    )
                }
            )
            .subscribe()

        // Subscribe to Wallet Balance Updates (Optional/Bonus)
        const walletChannel = supabase
            .channel("realtime-wallets")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "wallets",
                    filter: `user_id=eq.${initialProfile?.id}`
                },
                (payload) => {
                    if (payload.new.asset === 'USD') {
                        setBalance(payload.new.balance)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            supabase.removeChannel(walletChannel)
        }
    }, [supabase, initialProfile?.id])

    // Recalculate Portfolio Values on Asset Update
    let totalPortfolioValue = 0
    let totalInvestedValue = 0

    portfolio?.forEach((item) => {
        const asset = assets?.find((a) => a.symbol === item.symbol)
        if (asset) {
            const currentVal = item.amount * asset.current_price
            const investedVal = item.amount * item.average_buy_price
            totalPortfolioValue += currentVal
            totalInvestedValue += investedVal
        }
    })

    // Adjusted P/L logic
    const totalPnL = totalPortfolioValue - totalInvestedValue
    const pnlPercent =
        totalInvestedValue > 0 ? ((totalPnL / totalInvestedValue) * 100).toFixed(2) : "0.00"

    const displayBalance = balance

    return (
        <div className="space-y-6">
            <GeoUpdater />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                        Welcome back, <span className="text-gradient-gold">{initialProfile?.full_name || userEmail.split("@")[0] || "Trader"}</span>
                    </h1>
                    <p className="text-gray-400 font-medium">Your professional trading dashboard is ready.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/trade">
                        <Button className="bg-[#EBD062] hover:bg-[#d4af37] text-black font-bold h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(235,208,98,0.2)] transition-all hover:scale-105 active:scale-95">
                            Trade Now
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    label="USD Balance"
                    value={`$${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    trend={{
                        value: "Verified",
                        isPositive: true,
                    }}
                />
                <StatCard
                    label="Portfolio Value"
                    value={`$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={Activity}
                />
                <StatCard
                    label="Total P/L"
                    value={`${totalPnL >= 0 ? "+" : ""}$${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={TrendingUp}
                    trend={{
                        value: `${pnlPercent}%`,
                        isPositive: totalPnL >= 0,
                    }}
                    className={totalPnL >= 0 ? "border-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]" : "border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]"}
                />
                <StatCard
                    label="Bonus Balance"
                    value={`$${(initialProfile?.bonus_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={Crown}
                />
            </div>

            {/* Analytics Section - Phase 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <PortfolioChart />
                </div>
                <div className="lg:col-span-1">
                    <AllocationChart />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Market Overview */}
                    <GlassCard className="p-0 overflow-hidden border-white/5 bg-black/40 backdrop-blur-xl">
                        <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                            <div>
                                <h3 className="text-xl font-bold text-white">Market Overview</h3>
                                <p className="text-xs text-gray-400 mt-1">Real-time asset prices and 24h performance</p>
                            </div>
                            <Link href="/trade">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/80 hover:bg-primary/5 font-bold"
                                >
                                    View All
                                </Button>
                            </Link>
                        </div>
                        <div className="p-4">
                            <DataTable
                                data={assets || []}
                                columns={[
                                    {
                                        header: "Asset",
                                        accessor: (row: Asset) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[10px] text-primary border border-white/5">
                                                    {row.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white tracking-wide">{row.symbol}</div>
                                                    <div className="text-[10px] uppercase tracking-tighter text-gray-500">{row.name}</div>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        header: "Type",
                                        accessor: (row: Asset) => (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400 uppercase tracking-widest border border-white/5">
                                                {row.type}
                                            </span>
                                        ),
                                    },
                                    {
                                        header: "Price",
                                        accessor: (row: Asset) => (
                                            <span className="font-mono text-sm font-bold text-white">
                                                ${row.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        ),
                                    },
                                    {
                                        header: "24h",
                                        accessor: (row: Asset) => (
                                            <span
                                                className={cn(
                                                    "font-mono text-xs font-bold px-2 py-1 rounded-lg",
                                                    row.change_24h >= 0 ? "text-emerald-400 bg-emerald-400/5 border border-emerald-400/10" : "text-red-400 bg-red-400/5 border border-red-400/10"
                                                )}
                                            >
                                                {row.change_24h >= 0 ? "▲" : "▼"}{Math.abs(row.change_24h).toFixed(2)}%
                                            </span>
                                        ),
                                    },
                                    {
                                        header: "Action",
                                        accessor: (row: Asset) => (
                                            <Link href={`/trade?asset=${row.symbol}`}>
                                                <Button
                                                    variant="ghost"
                                                    className="text-primary hover:text-primary hover:bg-primary/10 h-9 font-bold rounded-lg transition-all"
                                                >
                                                    Trade
                                                </Button>
                                            </Link>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Credit Score Card */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <CreditScoreCard
                            creditScore={initialProfile?.credit_score || null}
                            creditScoreUpdatedAt={initialProfile?.credit_score_updated_at || null}
                        />
                    </div>

                    {/* Quick Actions */}
                    <GlassCard className="p-6 space-y-8 border-white/5 bg-white/[0.01] backdrop-blur-3xl">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/deposit" className="col-span-1">
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-primary/20 text-gray-300 rounded-xl transition-all flex flex-col items-center justify-center gap-1 group"
                                    >
                                        <DollarSign size={16} className="text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Deposit</span>
                                    </Button>
                                </Link>
                                <Link href="/withdrawal" className="col-span-1">
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-red-500/20 text-gray-300 rounded-xl transition-all flex flex-col items-center justify-center gap-1 group"
                                    >
                                        <Activity size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Withdraw</span>
                                    </Button>
                                </Link>
                                <Link href="/history" className="col-span-2">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 text-gray-400 rounded-xl transition-all font-bold tracking-wide"
                                    >
                                        Trade History
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Membership Status */}
                        <div className="pt-8 border-t border-white/5 relative">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl rounded-full -translate-y-8" />
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Account Status</span>
                                <Link href="/membership">
                                    <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer">Upgrade</span>
                                </Link>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(235,208,98,0.1)]">
                                    <Crown className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-0.5">Current Tier</div>
                                    <div className="font-bold text-xl text-white capitalize tracking-wide">
                                        {initialProfile?.membership_tier || "Silver"} Member
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Trade Volume</span>
                                <span className="text-xs font-mono font-bold text-white">${(initialProfile?.total_trade_volume || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Portfolio Holdings */}
            {portfolio && portfolio.length > 0 && (
                <GlassCard className="p-0 overflow-hidden border-white/5 bg-black/40 backdrop-blur-xl mt-8">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-xl font-bold text-white">Portfolio Analysis</h3>
                        <p className="text-xs text-gray-400 mt-1">Detailed breakdown of your current holdings</p>
                    </div>
                    <div className="p-4">
                        <DataTable
                            data={portfolio}
                            columns={[
                                {
                                    header: "Asset",
                                    accessor: (row: any) => (
                                        <span className="font-bold text-white tracking-widest">{row.symbol}</span>
                                    ),
                                },
                                {
                                    header: "Holdings",
                                    accessor: (row: any) => (
                                        <div className="font-mono text-sm">
                                            <div className="text-white font-bold">{Number(row.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Units held</div>
                                        </div>
                                    ),
                                },
                                {
                                    header: "Avg. Price",
                                    accessor: (row: any) => (
                                        <span className="font-mono text-xs text-gray-300">
                                            ${Number(row.average_buy_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    ),
                                },
                                {
                                    header: "Valuation",
                                    accessor: (row: any) => {
                                        const asset = assets?.find((a) => a.symbol === row.symbol)
                                        const value = (row.amount * (asset?.current_price || 0))
                                        return (
                                            <div className="font-mono text-sm">
                                                <div className="text-white font-bold">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                <div className="text-[10px] text-emerald-400 uppercase tracking-tighter">Market value</div>
                                            </div>
                                        )
                                    },
                                },
                                {
                                    header: "Net Profit/Loss",
                                    accessor: (row: any) => {
                                        const asset = assets?.find((a) => a.symbol === row.symbol)
                                        if (!asset) return <span>---</span>

                                        const cost = row.amount * row.average_buy_price
                                        const current = row.amount * asset.current_price
                                        const diff = current - cost
                                        const percent = (diff / cost) * 100

                                        return (
                                            <div className="flex flex-col items-end">
                                                <span
                                                    className={cn(
                                                        "font-mono font-bold text-sm",
                                                        diff >= 0 ? "text-emerald-400" : "text-red-400"
                                                    )}
                                                >
                                                    {diff >= 0 ? "+" : ""}${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold px-1 rounded bg-black/20 border border-current opacity-70",
                                                    diff >= 0 ? "text-emerald-400" : "text-red-400"
                                                )}>
                                                    {diff >= 0 ? "+" : ""}{percent.toFixed(2)}%
                                                </span>
                                            </div>
                                        )
                                    },
                                },
                            ]}
                        />
                    </div>
                </GlassCard>
            )}
        </div>
    )
}
