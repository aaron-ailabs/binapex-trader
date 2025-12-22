import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/utils/api-auth"
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit"

// Mock data generator helper
function generateMockData(
  symbol: string,
  days: number = 1,
  interval: string = "5m",
  basePrice: number = 50000
) {
  const data = []
  const now = new Date()
  const intervalMs = interval === "1m" ? 60000 : interval === "5m" ? 300000 : 3600000
  const points = Math.floor((days * 24 * 60 * 60 * 1000) / intervalMs)

  let currentPrice = basePrice
  let timestamp = now.getTime() - points * intervalMs

  for (let i = 0; i < points; i++) {
    const volatility = basePrice * 0.002 // 0.2% volatility
    const change = (Math.random() - 0.5) * volatility
    
    // Create accurate candle shape
    const open = currentPrice
    const close = currentPrice + change
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    const volume = Math.floor(Math.random() * 1000)

    data.push({
      timestamp: new Date(timestamp).toISOString(),
      open,
      high,
      low,
      close,
      volume,
    })

    currentPrice = close
    timestamp += intervalMs
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimitMiddleware(request, 30, 60000)
    if (rateLimitResponse) return rateLimitResponse

    const { user, error } = await requireAuth()
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { symbol, interval, assetType } = await request.json()

    if (!symbol || !interval || !assetType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    let chartData: { timestamp: string; open: number; high: number; low: number; close: number; volume: number }[] = []
    let isMock = false

    // Map interval to EODHD format (1min, 5min, 15min, 30min, 1h, 4h, 1d -> 1m, 5m, 15m, 30m, 1h, 4h, d)
    const eodhdInterval = interval === "1day" ? "d" : interval.replace("min", "m")

    try {
      if (assetType === "forex" || assetType === "crypto") {
        // Symbol Mapping
        // Forex: "EUR/USD" -> "EURUSD.FOREX"
        // Crypto: "BTC/USD" -> "BTC-USD.CC"
        let eodhdSymbol = symbol;
        if (assetType === "forex") {
             eodhdSymbol = `${symbol.replace("/", "")}.FOREX`
        } else if (assetType === "crypto") {
             eodhdSymbol = `${symbol.replace("/", "-")}.CC`
        }

        const apiKey = process.env.EODHD_API_TOKEN || "demo"
        // EODHD Intraday API: https://eodhd.com/api/intraday/{symbol}?api_token={api_token}&fmt=json&interval={interval}
        const url = `https://eodhd.com/api/intraday/${eodhdSymbol}?api_token=${apiKey}&fmt=json&interval=${eodhdInterval}`
        
        // console.log(`[Chart API] Fetching EODHD: ${url.replace(apiKey, "HIDDEN_KEY")}`)

        const response = await fetch(url)
        
        if (!response.ok) {
            // EODHD often returns 403 for free/demo keys on intraday data
            console.warn(`[Chart API] EODHD API request failed: ${response.status}. Falling back to mock data.`)
            throw new Error(`EODHD API error: ${response.status}`)
        }

        const data = await response.json()
        
        // Check for specific EODHD error messages in successful 200 responses (API sometimes does this)
        if (data && typeof data === 'string' && data.includes("Only EOD data allowed")) {
             throw new Error("EOD data restriction")
        }

        // EODHD returns array of objects directly: [{ timestamp, open, high, low, close, volume }, ...]
        if (Array.isArray(data)) {
             chartData = data.map((item: any) => ({
                timestamp: item.datetime || new Date(item.timestamp * 1000).toISOString(), 
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume || 0
            }))
        } else {
            console.error("[Chart API] Unexpected EODHD format:", data)
            throw new Error("Invalid data format")
        }

      } else {
         // Stock/Other - assume US exchange for now
         // "AAPL" -> "AAPL.US"
         const eodhdSymbol = `${symbol}.US`
         const apiKey = process.env.EODHD_API_TOKEN || "demo"
         const url = `https://eodhd.com/api/intraday/${eodhdSymbol}?api_token=${apiKey}&fmt=json&interval=${eodhdInterval}`
         
         const response = await fetch(url)
         if (!response.ok) throw new Error(`EODHD API error: ${response.status}`)
         const data = await response.json()

         if (data && typeof data === 'string' && data.includes("Only EOD data allowed")) {
            throw new Error("EOD data restriction")
         }

         if (Array.isArray(data)) {
             chartData = data.map((item: any) => ({
                timestamp: item.datetime || new Date(item.timestamp * 1000).toISOString(),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume || 0
            }))
        }
      }
      
      // If EODHD returns ascending (oldest -> newest), slice(-100) takes the LATEST 100.
      chartData = chartData.slice(-200) // Increase buffer slightly

    } catch (e: any) {
         // console.warn(`[Chart API] Provider Error: ${e.message}. Using mock data fallback.`)
         isMock = true
         
         // Generate base price based on symbol type
         let basePrice = 100
         if (assetType === 'crypto') {
             if (symbol.includes('BTC')) basePrice = 45000
             else if (symbol.includes('ETH')) basePrice = 2500
             else if (symbol.includes('SOL')) basePrice = 100
             else basePrice = 10
         } else if (assetType === 'forex') {
             basePrice = 1.10
         } else {
             basePrice = 150 // Generic stock
         }

         chartData = generateMockData(symbol, 1, eodhdInterval, basePrice)
    }

    return NextResponse.json({ chartData, isMock })
  } catch (error: any) {
    console.error("[v0] Chart data API error details:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch chart data" }, { status: 500 })
  }
}
