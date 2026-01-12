"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"

interface ExecutionWidgetProps {
    asset_symbol: string
    currentPrice: number
    payoutRate: number
    balance: number
    onSuccess: () => void
}

export function ExecutionWidget({ asset_symbol, currentPrice, payoutRate, balance, onSuccess }: ExecutionWidgetProps) {
    const supabase = createClient()
    const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop_limit'>('market')
    const [duration, setDuration] = useState(60)
    const [amount, setAmount] = useState("")
    const [limitPrice, setLimitPrice] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handlePercentage = (pct: number) => {
        const val = (balance * (pct / 100)).toFixed(2)
        setAmount(val)
    }

    const executeTrade = async (direction: 'HIGH' | 'LOW') => {
        if (!isValid) return

        // Mock Limit Order support for now (or handle differently if backend supported)
        if (orderType !== 'market') {
            alert("Limit / Stop orders are coming soon to the platform engine.")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/trading/binary/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    p_asset_symbol: asset_symbol,
                    p_direction: direction === 'HIGH' ? 'UP' : 'DOWN',
                    p_amount: Number(amount),
                    p_duration_seconds: duration
                })
            })

            const result = await response.json()

            if (!response.ok) throw new Error(result.error || "Internal Server Error")

            setAmount("")
            onSuccess()
        } catch (e: any) {
            console.error(e)
            alert(e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isValid = amount && Number(amount) > 0 && Number(amount) <= balance &&
        (orderType === 'market' || (limitPrice && Number(limitPrice) > 0))

    return (
        <div className="bg-[#1E1E1E] border border-gray-800 rounded-xl p-4 flex flex-col gap-5 shadow-2xl h-full">

            {/* Order Type Selection */}
            <div className="grid grid-cols-3 bg-black/20 p-1 rounded-lg">
                {['market', 'limit', 'stop_limit'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setOrderType(type as any)}
                        className={`text-[10px] font-bold uppercase py-1.5 rounded transition-all active-press ${orderType === type
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Limit Price Input (Conditional) */}
            {orderType !== 'market' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs text-gray-500 font-bold uppercase">Entry Price</label>
                    <div className="relative">
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={limitPrice}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d*\.?\d*$/.test(val)) setLimitPrice(val);
                            }}
                            className="bg-[#0A0A0A] border-[#333] text-white font-mono h-10 text-sm focus:border-amber-500 transition-all active-press"
                            placeholder={currentPrice.toFixed(2)}
                        />
                    </div>
                </div>
            )}

            {/* Step 1: Duration */}
            <div className="space-y-2">
                <label className="block text-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Duration</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x-mandatory">
                    {[
                        { label: '120s', value: 120 },
                        { label: '180s', value: 180 },
                        { label: '300s', value: 300 },
                        { label: '600s', value: 600 },
                        { label: '4h', value: 14400 },
                        { label: '24h', value: 86400 }
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setDuration(opt.value)}
                            className={`touch-target px-4 py-2 rounded-full font-mono font-bold text-sm whitespace-nowrap transition-all border snap-center active-press ${duration === opt.value
                                ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-[#2A2A2A] border-[#333] text-gray-400 hover:border-gray-600'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between px-1">
                    <span className="text-[10px] text-gray-500">Min: 60s</span>
                    <span className="text-[10px] text-gray-500">Max: 24h</span>
                </div>
            </div>

            {/* Step 2: Amount */}
            <div className="space-y-3 pt-2">
                <div className="flex justify-between items-end">
                    <label className="text-xs text-gray-500 font-bold uppercase">Investment</label>
                    <span className={`text-xs font-mono transition-colors ${Number(amount) > balance ? 'text-red-500' : 'text-gray-400'}`}>
                        Bal: ${balance.toFixed(2)}
                    </span>
                </div>

                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-sans text-xl pointer-events-none group-focus-within:text-emerald-500 transition-colors">$</span>
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                setAmount(val);
                            }
                        }}
                        className={`bg-[#0A0A0A] border pl-8 text-white font-mono text-xl h-14 transition-all active-press ${!amount ? 'border-[#333]' :
                            Number(amount) > balance ? 'border-red-500 focus:ring-red-500/50' :
                                'border-[#333] focus:border-emerald-500 focus:ring-emerald-500/50'
                            }`}
                        placeholder="100"
                    />
                </div>

                {/* Validation Message */}
                {Number(amount) > balance && (
                    <div className="text-[10px] text-red-500 font-bold text-center animate-pulse">
                        Insufficient Balance
                    </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: '25%', val: 25 },
                        { label: '50%', val: 50 },
                        { label: '75%', val: 75 },
                        { label: 'Max', val: 100 }
                    ].map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => handlePercentage(opt.val)}
                            className="touch-target bg-[#2A2A2A] hover:bg-[#333] text-xs font-bold text-gray-400 py-2 rounded border border-[#333] hover:border-gray-600 active:bg-emerald-500/20 active:text-emerald-500 transition-all font-mono active-press"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {/* Trade Summary hidden as per user request */}
                <div className="hidden">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Payout Rate</span>
                        <span className="text-emerald-400 font-bold">{payoutRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Investment</span>
                        <span className="text-white font-mono">${Number(amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 my-1"></div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-amber-500">Potential Profit</span>
                        <span className="text-emerald-400 font-mono text-sm">
                            +${(Number(amount || 0) * (payoutRate / 100)).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Step 3: Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <Button
                        onClick={() => executeTrade('HIGH')}
                        disabled={isSubmitting || !isValid}
                        className="h-20 flex flex-col gap-1 bg-gradient-to-t from-emerald-900 to-emerald-600 hover:to-emerald-500 border-none transition-all relative overflow-hidden group touch-target active-press disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        {isSubmitting ? <Loader2 className="animate-spin text-white" /> : <TrendingUp size={24} className="text-white mb-1" />}
                        <span className="text-lg font-black text-white uppercase tracking-tighter">Higher</span>
                    </Button>

                    <Button
                        onClick={() => executeTrade('LOW')}
                        disabled={isSubmitting || !isValid}
                        className="h-20 flex flex-col gap-1 bg-gradient-to-t from-rose-900 to-rose-600 hover:to-rose-500 border-none transition-all relative overflow-hidden group touch-target active-press disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        {isSubmitting ? <Loader2 className="animate-spin text-white" /> : <TrendingDown size={24} className="text-white mb-1" />}
                        <span className="text-lg font-black text-white uppercase tracking-tighter">Lower</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
