"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Sector } from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { PieChart as PieIcon, Info } from "lucide-react"

const COLORS = [
    "#EBD062", // Gold (USD)
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#F59E0B", // Amber
]

interface AllocationData {
    name: string
    value: number
    color: string
}

const initialData: AllocationData[] = [
    { name: "Liquid USD", value: 65, color: COLORS[0] },
    { name: "BTC-USD", value: 15, color: COLORS[1] },
    { name: "ETH-USD", value: 10, color: COLORS[2] },
    { name: "AAPL-STOCK", value: 5, color: COLORS[3] },
    { name: "Others", value: 5, color: COLORS[4] },
]

export function AllocationChart() {
    const [activeIndex, setActiveIndex] = React.useState(0)

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

        return (
            <g>
                <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#fff" className="text-xl font-bold font-mono">
                    {Math.round(percent * 100)}%
                </text>
                <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#999" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {payload.name}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 6}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 10}
                    outerRadius={outerRadius + 12}
                    fill={fill}
                />
            </g>
        )
    }

    return (
        <GlassCard className="p-6 border-white/5 bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full -translate-y-16 translate-x-16" />

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Asset Allocation</h3>
                </div>
                <Info className="h-4 w-4 text-gray-600 hover:text-gray-400 cursor-help" />
            </div>

            <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={initialData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            stroke="none"
                            animationBegin={200}
                            animationDuration={1000}
                        >
                            {initialData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} opacity={activeIndex === index ? 1 : 0.6} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
                {initialData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "h-2.5 w-2.5 rounded-full transition-transform group-hover/item:scale-125",
                                    item.name === "Liquid USD" && "bg-[#EBD062]",
                                    item.name === "BTC-USD" && "bg-[#10B981]",
                                    item.name === "ETH-USD" && "bg-[#3B82F6]",
                                    item.name === "AAPL-STOCK" && "bg-[#8B5CF6]",
                                    item.name === "Others" && "bg-[#EC4899]"
                                )}
                            />
                            <span className="text-xs font-semibold text-gray-400 group-hover/item:text-white transition-colors">
                                {item.name}
                            </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-white">
                            {item.value}%
                        </span>
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}
