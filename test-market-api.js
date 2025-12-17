
const allTickers = [
  'SGD=X', 'PHP=X', 'NZD=X', 'EUR=X', 'MYR=X', 'AUD=X', 'GBP=X', 'JPY=X', 'THB=X', 'IDR=X', 'HKD=X', 'KRW=X',
  'WMT', 'AVGO', 'GOOGL', 'GOOG', 'MSFT', 'NVDA', 'AMZN', 'META', 'AAPL', 'JPM', 'LLY', 'TSLA',
  'GC=F', 'ALI=F', 'HG=F', 'PA=F', 'PL=F', 'SIL=F', 'BZ=F', 'CL=F', 'NG=F', 'RB=F', 'HO=F', 'KC=F',
  'BTC-USD', 'ETH-USD', 'BCH-USD', 'USDT-USD', 'ETC-USD', 'UNI7083-USD', 'LINK-USD', 'SOL-USD', 'DOGE-USD', 'ADA-USD', 'MATIC-USD', 'LTC-USD'
];

async function test() {
  const symbolsQuery = allTickers.join(',');
  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsQuery}`;

  console.log("Fetching from Yahoo...");
  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await response.json();
    const result = data?.quoteResponse?.result || [];
    console.log(`Success! Fetched ${result.length} quotes.`);
    if (result.length > 0) {
      console.log("Sample quote (BTC-USD):", result.find(q => q.symbol === 'BTC-USD'));
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

test();
