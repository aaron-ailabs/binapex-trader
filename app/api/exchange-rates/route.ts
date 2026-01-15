import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic" // Disable caching

/**
 * GET /api/exchange-rates
 *
 * Returns current exchange rates for currency conversions.
 * This endpoint is used by traders to get accurate conversion rates
 * that are managed by the admin portal.
 *
 * Query Parameters:
 * - from: Source currency code (e.g., "USD")
 * - to: Target currency code (e.g., "MYR")
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "from": "USD",
 *     "to": "MYR",
 *     "rate": 4.45,
 *     "updated_at": "2026-01-14T10:30:00Z"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // If no parameters, return all active rates
    if (!from && !to) {
      const { data: rates, error } = await supabase
        .from("exchange_rates")
        .select("*")
        .order("updated_at", { ascending: false })

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: rates
      })
    }

    // Validate required parameters for specific rate lookup
    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: "Both 'from' and 'to' currency codes are required" },
        { status: 400 }
      )
    }

    // Get specific exchange rate via RPC function
    const { data: rate, error } = await supabase
      .rpc("get_exchange_rate", {
        p_from_currency: from.toUpperCase(),
        p_to_currency: to.toUpperCase()
      })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // If rate is 0, currency pair not found
    if (rate === 0 || rate === null) {
      return NextResponse.json(
        {
          success: false,
          error: `Exchange rate not found for ${from}/${to}`
        },
        { status: 404 }
      )
    }

    // Get the full rate record with metadata
    const { data: rateRecord, error: recordError } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("from_currency", from.toUpperCase())
      .eq("to_currency", to.toUpperCase())
      .single()

    if (recordError && recordError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: recordError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: rate,
        updated_at: rateRecord?.updated_at || null
      }
    })

  } catch (error) {
    console.error("[Exchange Rates API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
