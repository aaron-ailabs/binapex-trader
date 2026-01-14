"use client"

import { cn } from "@/lib/utils"

interface PasswordStrengthMeterProps {
    score: number
    feedback: string
}

export function PasswordStrengthMeter({ score, feedback }: PasswordStrengthMeterProps) {
    // Score is 0-4
    const segments = [0, 1, 2, 3]

    const getColor = (score: number) => {
        switch (score) {
            case 0: return "bg-gray-700"
            case 1: return "bg-red-500"
            case 2: return "bg-orange-500"
            case 3: return "bg-yellow-500"
            case 4: return "bg-emerald-500"
            default: return "bg-gray-700"
        }
    }

    return (
        <div className="space-y-1">
            <div className="flex gap-1 h-1.5">
                {segments.map((segment) => (
                    <div
                        key={segment}
                        className={cn(
                            "h-full flex-1 rounded-full transition-colors duration-300",
                            score > segment ? getColor(score) : "bg-gray-800"
                        )}
                    />
                ))}
            </div>
            <p className={cn("text-xs transition-colors duration-300 text-right font-medium",
                score <= 2 ? "text-red-400" : score === 3 ? "text-yellow-400" : "text-emerald-400"
            )}>
                {feedback || "Enter a password"}
            </p>
        </div>
    )
}
