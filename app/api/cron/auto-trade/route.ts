import { NextRequest, NextResponse } from "next/server"
import { StrategyEngine } from "@/lib/services/strategy-engine"

export const dynamic = 'force-dynamic' // Ensure not cached

export async function GET(request: NextRequest) {
  // Security: Check for Cron Secret if production
  // Vercel sends `Authorization: Bearer <CRON_SECRET>`
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const engine = new StrategyEngine()
    const result = await engine.executeStrategies()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Auto-Trade] Cron failed:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
