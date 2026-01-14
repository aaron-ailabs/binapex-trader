import { createClient } from "@/lib/supabase/server"
import { getLivePrice, getAsset } from "@/lib/market-data"
import { NextResponse } from "next/server"
import { captureApiError } from "@/lib/utils/error-handler"

export async function POST(req: Request) {
    let userId: string | undefined
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        userId = user.id

        const { p_asset_symbol, p_direction, p_amount, p_duration_seconds } = await req.json()

        if (!p_asset_symbol || !p_direction || !p_amount || !p_duration_seconds) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. SEC-03: Fetch Strike Price Server-Side (Oracle Enforcement)
        const strikePrice = await getLivePrice(p_asset_symbol)
        if (!strikePrice || strikePrice <= 0) {
            return NextResponse.json({ error: "Market is currently unavailable for this asset" }, { status: 400 })
        }

        // 2. Fetch Payout Rate from DB
        const asset = await getAsset(p_asset_symbol)
        const payoutRate = asset?.payout_rate || 85

        // 3. Execute Trade via RPC
        const { data, error } = await supabase.rpc('execute_binary_trade', {
            p_user_id: user.id,
            p_amount: Number(p_amount),
            p_asset_symbol,
            p_direction,
            p_duration_seconds: Number(p_duration_seconds),
            p_strike_price: strikePrice,
            p_payout_rate: payoutRate
        })

        if (error) throw error
        if (!data.success) throw new Error(data.error || "Execution failed")

        return NextResponse.json({
            success: true,
            order_id: data.order_id,
            strike_price: strikePrice,
            expiry_at: data.expiry_at
        })

    } catch (error: any) {
        captureApiError(error, {
            userId,
            endpoint: "/api/trading/binary/execute",
            action: "execute-binary-trade"
        })
        return NextResponse.json({ error: error.message || "Execution error" }, { status: 500 })
    }
}
