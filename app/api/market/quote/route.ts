import { NextResponse } from 'next/server';
import { getAsset } from '@/lib/market-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

  try {
    const asset = await getAsset(symbol);
    
    // If it's a crypto asset, use Binance for better real-time data
    if (asset?.category === 'crypto' || asset?.type === 'crypto') {
      let binanceSymbol = symbol.replace('-', '').replace('/', '') + 'T'; // e.g., BTC-USD -> BTCUSDT
      
      // Special mapping for certain symbols
      if (symbol.startsWith('UNI')) binanceSymbol = 'UNIUSDT';
      if (symbol.startsWith('MATIC')) binanceSymbol = 'POLUSDT'; // MATIC was rebranded to POL on Binance
      
      try {
        const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
        if (binanceResponse.ok) {
          const bData = await binanceResponse.json();
          return NextResponse.json({
            symbol,
            price: parseFloat(bData.lastPrice),
            change: parseFloat(bData.priceChange),
            changePercent: parseFloat(bData.priceChangePercent)
          });
        }
      } catch (e) {
        console.warn(`Binance fetch failed for ${binanceSymbol}, falling back to Yahoo`, e);
      }
    }

    // Fallback to Yahoo Finance for stocks, forex, or if Binance fails
    const ticker = asset?.yahoo_ticker || (symbol.includes('/') ? symbol.replace('/', '-') : symbol);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1m`;
    const response = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 5 } // Short cache for live price
    });

    if (!response.ok) throw new Error('Failed to fetch quote');

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) throw new Error('No quote data');

    return NextResponse.json({
      symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
    });

  } catch (error) {
    console.error(`Quote error for ${symbol}:`, error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
