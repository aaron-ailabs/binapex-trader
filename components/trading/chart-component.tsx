
"use client"


import { useEffect, useRef } from "react"
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts"
import type { IChartApi, ISeriesApi } from "lightweight-charts"

interface ChartComponentProps {
  data: {
    time: string | number
    open: number
    high: number
    low: number
    close: number
    volume?: number
  }[]
  colors?: {
    backgroundColor?: string
    lineColor?: string
    textColor?: string
    areaTopColor?: string
    areaBottomColor?: string
  }
}

export const ChartComponent = ({
  data,
  colors: {
    backgroundColor = "transparent",
    lineColor = "#2962FF",
    textColor = "white",
    areaTopColor = "#2962FF",
    areaBottomColor = "rgba(41, 98, 255, 0.28)",
  } = {},
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current!.clientWidth })
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      }
    })

    const series = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a', 
        downColor: '#ef5350', 
        borderVisible: false, 
        wickUpColor: '#26a69a', 
        wickDownColor: '#ef5350'
    })
    
    series.setData(data as any)
    seriesRef.current = series
    chartRef.current = chart

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor])

  useEffect(() => {
    if (seriesRef.current && data) {
      seriesRef.current.setData(data as any)
      if (data.length > 0) {
          chartRef.current?.timeScale().fitContent()
      }
    }
  }, [data])

  return <div ref={chartContainerRef} className="w-full h-[300px]" />
}
