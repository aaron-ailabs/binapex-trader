import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// ASSET CONFIGURATIONS (Sourced from history route)
// ═══════════════════════════════════════════════════════════════

const FOREX_ASSETS: Record<string, string> = {
  'USD/SGD': 'SGD=X', 'USD/PHP': 'PHP=X', 'USD/NZD': 'NZD=X', 'USD/EUR': 'EUR=X',
  'USD/MYR': 'MYR=X', 'USD/AUD': 'AUD=X', 'USD/GBP': 'GBP=X', 'USD/JPY': 'JPY=X',
  'USD/THB': 'THB=X', 'USD/IDR': 'IDR=X', 'USD/HKD': 'HKD=X', 'USD/KRW': 'KRW=X'
};

const STOCK_ASSETS = ['WMT', 'AVGO', 'GOOGL', 'GOOG', 'MSFT', 'NVDA', 'AMZN', 'META', 'AAPL', 'JPM', 'LLY', 'TSLA'];

const COMMODITY_ASSETS: Record<string, string> = {
  'Gold': 'GC=F', 'Aluminum': 'ALI=F', 'Copper': 'HG=F', 'Palladium': 'PA=F',
  'Platinum': 'PL=F', 'Silver': 'SIL=F', 'Brent Oil': 'BZ=F', 'Crude Oil': 'CL=F',
  'Natural Gas': 'NG=F', 'Gasoline': 'RB=F', 'Heating Oil': 'HO=F', 'Coffee': 'KC=F'
};

const CRYPTO_ASSETS = ['BTC-USD', 'ETH-USD', 'BCH-USD', 'USDT-USD', 'ETC-USD', 'UNI7083-USD', 'LINK-USD', 'SOL-USD', 'DOGE-USD', 'ADA-USD', 'MATIC-USD', 'LTC-USD'];

export async function GET() {
  // Combine all symbols for batch request
  const allTickers = [
    ...Object.values(FOREX_ASSETS),
    ...STOCK_ASSETS,
    ...Object.values(COMMODITY_ASSETS),
    ...CRYPTO_ASSETS
  ];

  try {
    const symbolsQuery = allTickers.join(',');
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsQuery}`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Yahoo API returned ${response.status}`);
    }

    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];
    
    // Index quotes by symbol for fast lookup
    const quoteMap: Record<string, any> = {};
    quotes.forEach((q: any) => {
      quoteMap[q.symbol] = q;
    });

    // Helper to format individual asset info
    const formatAsset = (displaySymbol: string, ticker: string) => {
      const q = quoteMap[ticker] || {};
      const price = q.regularMarketPrice || 0;
      const prevClose = q.regularMarketPreviousClose || price;
      const change_pct = prevClose !== 0 ? (price - prevClose) / prevClose : 0;

      return {
        symbol: displaySymbol,
        ticker: ticker,
        price: ticker.includes('=X') ? undefined : price,
        rate: ticker.includes('=X') ? price : undefined,
        change_pct: q.regularMarketChangePercent / 100 || change_pct,
        volume: q.regularMarketVolume || 0
      };
    };

    // Construct DashboardData structure
    const results = {
      stocks: STOCK_ASSETS.reduce((acc, ticker) => {
        acc[ticker] = formatAsset(ticker, ticker);
        return acc;
      }, {} as any),
      forex: Object.entries(FOREX_ASSETS).reduce((acc, [name, ticker]) => {
        acc[name] = formatAsset(name, ticker);
        return acc;
      }, {} as any),
      crypto: CRYPTO_ASSETS.reduce((acc, ticker) => {
        const displayName = ticker.replace('-USD', '/USD');
        acc[displayName] = formatAsset(displayName, ticker);
        return acc;
      }, {} as any),
      commodities: Object.entries(COMMODITY_ASSETS).reduce((acc, [name, ticker]) => {
        acc[name] = formatAsset(name, ticker);
        return acc;
      }, {} as any),
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Market dashboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
