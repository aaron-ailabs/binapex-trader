import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// BINAPEX ASSET CONFIGURATION (48 Total Assets)
// ═══════════════════════════════════════════════════════════════

// 💱 FOREX (12 Currency Pairs)
export const FOREX_ASSETS = {
  'USD/SGD': 'SGD=X',
  'USD/PHP': 'PHP=X',
  'USD/NZD': 'NZD=X',
  'USD/EUR': 'EUR=X',
  'USD/MYR': 'MYR=X',
  'USD/AUD': 'AUD=X',
  'USD/GBP': 'GBP=X',
  'USD/JPY': 'JPY=X',
  'USD/THB': 'THB=X',
  'USD/IDR': 'IDR=X',
  'USD/HKD': 'HKD=X',
  'USD/KRW': 'KRW=X'
};

// 📈 STOCKS (12 US-Listed Companies)
export const STOCK_ASSETS = [
  'WMT',    // Walmart
  'AVGO',   // Broadcom Inc.
  'GOOGL',  // Alphabet Inc.
  'GOOG',   // Google
  'MSFT',   // Microsoft Corporation
  'NVDA',   // NVIDIA Corporation
  'AMZN',   // Amazon.com, Inc.
  'META',   // Meta Platforms, Inc.
  'AAPL',   // Apple Inc.
  'JPM',    // JP Morgan Chase & Co.
  'LLY',    // Eli Lilly and Company
  'TSLA'    // Tesla, Inc.
];

// 🛢️ COMMODITIES (12 Assets)
export const COMMODITY_ASSETS = {
  // Metals
  'Gold': 'GC=F',
  'Aluminum': 'ALI=F',
  'Copper': 'HG=F',
  'Palladium': 'PA=F',
  'Platinum': 'PL=F',
  'Silver': 'SIL=F',
  // Energy
  'Brent Oil': 'BZ=F',
  'Crude Oil': 'CL=F',
  'Natural Gas': 'NG=F',
  'Gasoline': 'RB=F',
  'Heating Oil': 'HO=F',
  // Other
  'Coffee': 'KC=F'
};

// ₿ CRYPTOCURRENCIES (12 Digital Assets)
export const CRYPTO_ASSETS = [
  'BTC-USD',   // Bitcoin
  'ETH-USD',   // Ethereum
  'BCH-USD',   // Bitcoin Cash
  'USDT-USD',  // Tether USD
  'ETC-USD',   // Ethereum Classic
  'UNI7083-USD', // Uniswap
  'LINK-USD',  // Chainlink
  'SOL-USD',   // Solana
  'DOGE-USD',  // Dogecoin
  'ADA-USD',   // Cardano
  'MATIC-USD', // Polygon
  'LTC-USD'    // Litecoin
];

// ═══════════════════════════════════════════════════════════════
// YAHOO FINANCE API HANDLER
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC-USD';
  const period = searchParams.get('period') || '1mo';
  const interval = searchParams.get('interval') || '1d';

  // Map period to range for Yahoo Finance API
  const rangeMap: Record<string, string> = {
    '1d': '1d',
    '5d': '5d',
    '1mo': '1mo',
    '3mo': '3mo',
    '6mo': '6mo',
    '1y': '1y',
    '2y': '2y',
    '5y': '5y',
    'ytd': 'ytd',
    'max': 'max'
  };

  const range = rangeMap[period] || '1mo';

  try {
    // Yahoo Finance v8 Chart API (Same data source as yfinance library)
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Yahoo API returned ${response.status}`);
    }

    const data = await response.json();

    // Check if data is valid
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid symbol or no data available');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    // Check if timestamps exist
    if (!timestamps || timestamps.length === 0) {
      throw new Error('No timestamp data available');
    }

    // Transform to TradingView Lightweight Charts format
    const chartData = timestamps.map((time: number, i: number) => {
      // For daily data, use YYYY-MM-DD format
      // For intraday data, use unix timestamp
      const timeValue = interval === '1d'
        ? new Date(time * 1000).toISOString().split('T')[0]
        : time;

      return {
        time: timeValue,
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i] || 0
      };
    }).filter((candle: any) =>
      // Remove invalid candles (null values)
      candle.open !== null &&
      candle.high !== null &&
      candle.low !== null &&
      candle.close !== null
    );

    return NextResponse.json(chartData, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Market data fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error',
        symbol: symbol
      },
      { status: 500 }
    );
  }
}
