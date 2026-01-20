"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DataPoint {
    date: string
    value: number
}

const chartConfig = {
    value: {
        label: "Portfolio Value",
        color: "#EBD062",
    },
}

export function PortfolioChart() {
    const [timeRange, setTimeRange] = React.useState("1M")
    const [data, setData] = React.useState<DataPoint[]>([])
    const [loading, setLoading] = React.useState(true)

    // Generate sophisticated mock data for demonstration
    // In production, this would be replaced by an API call to a balance_history table
    React.useEffect(() => {
        setLoading(true)
        const points = timeRange === "1D" ? 24 : timeRange === "1W" ? 7 : timeRange === "1M" ? 30 : 90
        const mockData: DataPoint[] = []
        let baseValue = 12450.50
        const now = new Date()

        for (let i = points; i >= 0; i--) {
            const date = new Date(now)
            if (timeRange === "1D") date.setHours(now.getHours() - i)
            else date.setDate(now.getDate() - i)

            // Random walk with upward bias
            const change = (Math.random() - 0.45) * (baseValue * 0.02)
            baseValue += change

            mockData.push({
                date: timeRange === "1D" ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                value: parseFloat(baseValue.toFixed(2))
            })
        }

        // Simulate network delay
        setTimeout(() => {
            setData(mockData)
            setLoading(false)
        }, 500)
    }, [timeRange])

    const currentValue = data.length > 0 ? data[data.length - 1].value : 0
    const startValue = data.length > 0 ? data[0].value : 0
    const percentageChange = ((currentValue - startValue) / startValue) * 100
    const isPositive = percentageChange >= 0

    return (
        <GlassCard className="p-0 overflow-hidden border-white/5 bg-black/40 backdrop-blur-xl relative group">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/5 blur-[100px] pointer-events-none" />

            <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Growth Performance</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-bold text-white font-mono tracking-tight tabular-nums">
                            ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <div className={cn(
                            "flex items-center gap-1 text-sm font-bold",
                            isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {isPositive ? "+" : ""}{percentageChange.toFixed(2)}%
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    {["1D", "1W", "1M", "ALL"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                                timeRange === range
                                    ? "bg-primary text-black shadow-[0_0_15px_rgba(235,208,98,0.3)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full mt-4 pr-2">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            hide
                            domain={['dataMin - 100', 'dataMax + 100']}
                        />
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-value)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ChartContainer>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Equity Value</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Buying Power</span>
                    </div>
                </div>
                <span className="text-[10px] text-gray-600 font-medium">Last synced: Just now</span>
            </div>
        </GlassCard>
    )
}
