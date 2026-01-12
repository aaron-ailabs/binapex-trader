"use client"

import { useEffect, useRef, memo } from "react"
import { Loader2 } from "lucide-react"

interface TradingViewWidgetProps {
    symbol: string
    theme?: "light" | "dark"
    autosize?: boolean
    interval?: string
    timezone?: string
}

declare global {
    interface Window {
        TradingView: any
    }
}

// Helper to map internal symbols to TradingView symbols
const mapSymbol = (symbol: string): string => {
    const s = symbol.toUpperCase()

    // 1. COMMODITIES (12)
    const commodities: Record<string, string> = {
        'GOLD': 'OANDA:XAUUSD',
        'SILVER': 'OANDA:XAGUSD',
        'CRUDE OIL': 'TVC:USOIL',
        'BRENT OIL': 'TVC:UKOIL',
        'NATURAL GAS': 'TVC:NATGAS',
        'PLATINUM': 'OANDA:XPTUSD',
        'PALLADIUM': 'OANDA:XPDUSD',
        'COPPER': 'OANDA:XCUUSD',
        'COFFEE': 'ICEUS:KC1!',
        'ALUMINUM': 'COMEX:ALI1!',
        'GASOLINE': 'NYMEX:RB1!',
        'HEATING OIL': 'NYMEX:HO1!',
    }
    if (commodities[s] || commodities[s.replace('/', '')]) {
        return commodities[s] || commodities[s.replace('/', '')]
    }

    // 2. CRYPTO (12 Major Pairs)
    // Maps specific internal formats (BTC/USD, BTCUSD, etc.) to Coinbase/Binance
    const crypto: Record<string, string> = {
        'BTC/USD': 'COINBASE:BTCUSD',
        'ETH/USD': 'COINBASE:ETHUSD',
        'XRP/USD': 'COINBASE:XRPUSD',
        'SOL/USD': 'COINBASE:SOLUSD',
        'BNB/USD': 'BINANCE:BNBUSD', // BNB usually on Binance
        'ADA/USD': 'COINBASE:ADAUSD',
        'DOGE/USD': 'COINBASE:DOGEUSD',
        'DOT/USD': 'COINBASE:DOTUSD',
        'AVAX/USD': 'COINBASE:AVAXUSD',
        'LINK/USD': 'COINBASE:LINKUSD',
        'LTC/USD': 'COINBASE:LTCUSD',
        'MATIC/USD': 'COINBASE:MATICUSD',
    }
    if (crypto[s]) return crypto[s]

    // 3. FOREX (12 Major Pairs)
    const forex: Record<string, string> = {
        'EUR/USD': 'FX:EURUSD',
        'GBP/USD': 'FX:GBPUSD',
        'USD/JPY': 'FX:USDJPY',
        'USD/CHF': 'FX:USDCHF',
        'AUD/USD': 'FX:AUDUSD',
        'USD/CAD': 'FX:USDCAD',
        'NZD/USD': 'FX:NZDUSD',
        'EUR/GBP': 'FX:EURGBP',
        'EUR/JPY': 'FX:EURJPY',
        'GBP/JPY': 'FX:GBPJPY',
        'AUD/JPY': 'FX:AUDJPY',
        'USD/CNY': 'FX:USDCNY',
    }
    if (forex[s]) return forex[s]

    // 4. STOCKS (12 Tech/Blue Chip)
    const stocks: Record<string, string> = {
        'AAPL': 'NASDAQ:AAPL',
        'MSFT': 'NASDAQ:MSFT',
        'GOOGL': 'NASDAQ:GOOGL',
        'AMZN': 'NASDAQ:AMZN',
        'TSLA': 'NASDAQ:TSLA',
        'META': 'NASDAQ:META',
        'NVDA': 'NASDAQ:NVDA',
        'NFLX': 'NASDAQ:NFLX',
        'AMD': 'NASDAQ:AMD',
        'INTC': 'NASDAQ:INTC',
        'COIN': 'NASDAQ:COIN',
        'BABA': 'NYSE:BABA',
    }
    if (stocks[s]) return stocks[s]

    // FALLBACKS
    // Forex/Crypto Logic fallback
    if (s.includes('/') && !s.includes('BTC') && !s.includes('ETH')) {
        const clean = s.replace('/', '')
        if (clean.length === 6) return `FX:${clean}`
    }
    if (s.endsWith('USD')) return `COINBASE:${s.replace('/', '').replace('USD', '')}USD`

    // Default to NASDAQ for anything else (Stocks)
    return `NASDAQ:${s}`
}

export const TradingViewWidget = memo(({ symbol, theme = "dark", autosize = true, interval = "D", timezone = "Etc/UTC" }: TradingViewWidgetProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const containerId = useRef(`tradingview_${Math.random().toString(36).substring(7)}`).current

    useEffect(() => {
        // Dynamically load TradingView script
        let script = document.querySelector(`script[src="https://s3.tradingview.com/tv.js"]`) as HTMLScriptElement

        const initWidget = () => {
            if (containerRef.current && window.TradingView) {
                // Clear previous widget
                containerRef.current.innerHTML = ""
                const mappedSymbol = mapSymbol(symbol)

                new window.TradingView.widget({
                    "width": "100%",
                    "height": "100%",
                    "symbol": mappedSymbol,
                    "interval": interval,
                    "timezone": timezone,
                    "theme": theme,
                    "style": "1", // 1 = Candles
                    "locale": "en",
                    "enable_publishing": false,
                    "allow_symbol_change": false,
                    "container_id": containerId,
                    "hide_side_toolbar": false,
                    "details": true,
                    "hotlist": false,
                    "calendar": false,
                    "studies": [
                        "RSI@tv-basicstudies",
                        "MASimple@tv-basicstudies"
                    ],
                    "toolbar_bg": "#f1f3f6",
                })
            }
        }

        if (!script) {
            script = document.createElement("script")
            script.src = "https://s3.tradingview.com/tv.js"
            script.async = true
            script.onload = initWidget
            document.head.appendChild(script)
        } else {
            // If script already exists/loaded, just init
            if (window.TradingView) {
                initWidget()
            } else {
                // Wait for it to load if it's there but not ready?
                // Better to just attach onload if not loaded, but script might be loaded.
                // Simple poll or check loaded property?
                // script.onload handles it if we attach new listener?
                // Safer:
                const existingOnLoad = script.onload
                script.onload = (e) => {
                    if (existingOnLoad) (existingOnLoad as any)(e)
                    initWidget()
                }
            }
        }

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = ""
        }
    }, [symbol, theme, interval, timezone, containerId]) // Re-run on symbol change

    return (
        <div className="w-full h-full relative bg-black/40 border border-white/5 rounded-lg overflow-hidden">
            <div id={containerId} ref={containerRef} className="w-full h-full" />
            {/* Placeholder/Loader while loading */}
            <div className="absolute inset-0 z-[-1] flex items-center justify-center text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Loading Chart...
            </div>
        </div>
    )
})

TradingViewWidget.displayName = "TradingViewWidget"
