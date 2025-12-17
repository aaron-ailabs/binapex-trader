
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from market_data import get_realtime_dashboard, get_chart_history, get_stock_price, get_forex_price, get_crypto_price, get_commodity_price

app = FastAPI()

# Enable CORS for localhost:3000
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Binapex Market Data Service"}

@app.get("/api/dashboard")
def api_dashboard():
    """Calls get_realtime_dashboard() to return all asset prices."""
    return get_realtime_dashboard()

@app.get("/api/history/{symbol}")
def api_history(symbol: str, period: str = '1mo', interval: str = '1d'):
    """Accepts a symbol and returns OHLCV data formatted for TradingView Charts."""
    return get_chart_history(symbol, period, interval)

@app.get("/api/quote/stock/{symbol}")
def api_quote_stock(symbol: str):
    return get_stock_price(symbol)

@app.get("/api/quote/forex/{symbol}")
def api_quote_forex(symbol: str):
    return get_forex_price(symbol)

@app.get("/api/quote/crypto/{symbol}")
def api_quote_crypto(symbol: str):
    return get_crypto_price(symbol)

@app.get("/api/price")
def api_price(symbol: str):
    """Returns live price for a specific symbol."""
    # Try different getter methods based on symbol format assumption or just try one
    # The existing market_data getters return a dict with 'price' or 'rate'
    # We want a unified { symbol, price } response
    try:
        if "=X" in symbol:
            data = get_forex_price(symbol)
            return {"symbol": symbol, "price": data.get('rate')}
        elif "=F" in symbol:
            data = get_commodity_price(symbol)
            return {"symbol": symbol, "price": data.get('price')}
        elif "-USD" in symbol or "-EUR" in symbol or "-BTC" in symbol:
            data = get_crypto_price(symbol)
            return {"symbol": symbol, "price": data.get('price')}
        else:
            data = get_stock_price(symbol)
            return {"symbol": symbol, "price": data.get('price')}
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "price": 0}

@app.get("/api/candles")
def api_candles(symbol: str, range: str = '1d'):
    """Returns OHLC data for charts. 
       Query params: symbol, range (default 1d). 
       Mapping range to yfinance period/interval.
    """
    # Mapping
    # 1d -> 1d interval, 1mo period? Or 1d range -> 1m interval?
    # User prompt example: "GET /api/candles?symbol={symbol}&range=1d"
    # Usually "range=1d" means show me today's data (intraday).
    # If range=1d, interval=5m or 15m.
    # If range=1mo, interval=1d.
    
    period = '1mo'
    interval = '1d'
    
    if range == '1d':
        period = '1d'
        interval = '5m'
    elif range == '1w':
        period = '5d'
        interval = '15m'
    elif range == '1mo':
        period = '1mo'
        interval = '1d'
    elif range == '1y':
        period = '1y'
        interval = '1wk'
        
    return get_chart_history(symbol, period, interval)

@app.get("/api/market/history")
def api_market_history(symbol: str, period: str = '1mo', interval: str = '1d'):
    """Returns OHLC data for charts with flexible period and interval."""
    try:
        data = get_chart_history(symbol, period, interval)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quote/commodity/{symbol}")
def api_quote_commodity(symbol: str):
    return get_commodity_price(symbol)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
