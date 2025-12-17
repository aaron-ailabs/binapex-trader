export interface Asset {
  symbol: string
  name: string
  price: number
  change24h: number
  type: "crypto" | "forex" | "stock" | "commodity"
}

export const MOCK_ASSETS: Asset[] = [
  { symbol: "BTC/USD", name: "Bitcoin", price: 98234.5, change24h: 2.34, type: "crypto" },
  { symbol: "ETH/USD", name: "Ethereum", price: 3845.23, change24h: -1.23, type: "crypto" },
  { symbol: "EUR/USD", name: "Euro/US Dollar", price: 1.0845, change24h: 0.12, type: "forex" },
  { symbol: "GBP/USD", name: "British Pound/US Dollar", price: 1.2673, change24h: -0.34, type: "forex" },
  { symbol: "GOLD", name: "Gold", price: 2034.5, change24h: 1.45, type: "commodity" },
  { symbol: "AAPL", name: "Apple Inc.", price: 189.23, change24h: 3.21, type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 242.84, change24h: -2.45, type: "stock" },
  { symbol: "SOL/USD", name: "Solana", price: 145.67, change24h: 5.67, type: "crypto" },
]

export const MOCK_TICKER = [
  ...MOCK_ASSETS,
  ...MOCK_ASSETS, // Duplicate for seamless scrolling
]
