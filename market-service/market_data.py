
import yfinance as yf
import pandas as pd

# ═══════════════════════════════════════════════════════════════
# BINAPEX SYMBOL MAPPING
# ═══════════════════════════════════════════════════════════════

STOCKS = ['GOOG', 'MSFT', 'NVDA', 'WMT', 'AVGO']

FOREX = {
    'EUR/USD': 'EURUSD=X', 'GBP/USD': 'GBPUSD=X', 'AUD/USD': 'AUDUSD=X',
    'NZD/USD': 'NZDUSD=X', 'USD/JPY': 'JPY=X', 'USD/SGD': 'SGD=X',
    'USD/MYR': 'MYR=X', 'USD/PHP': 'PHP=X', 'USD/THB': 'THB=X',
    'USD/IDR': 'IDR=X', 'USD/HKD': 'HKD=X', 'USD/KRW': 'KRW=X'
}

CRYPTO = {
    'BTC/USD': 'BTC-USD', 'ETH/USD': 'ETH-USD', 'SOL/USD': 'SOL-USD',
    'DOGE/USD': 'DOGE-USD', 'ADA/USD': 'ADA-USD', 'MATIC/USD': 'MATIC-USD',
    'LTC/USD': 'LTC-USD', 'ETH/BTC': 'ETH-BTC', 'BTC/EUR': 'BTC-EUR',
    'BTC/GBP': 'BTC-GBP', 'USDT/USD': 'USDT-USD'
}

COMMODITIES = {
    'Crude Oil': 'CL=F', 'Brent Oil': 'BZ=F', 'Natural Gas': 'NG=F',
    'Heating Oil': 'HO=F', 'Gasoline': 'RB=F', 'Gold': 'GC=F',
    'Silver': 'SI=F', 'Copper': 'HG=F', 'Palladium': 'PA=F',
    'Platinum': 'PL=F', 'Coffee': 'KC=F'
}

# Combine all symbol lists for batch operations
ALL_SYMBOLS = STOCKS + list(FOREX.values()) + list(CRYPTO.values()) + list(COMMODITIES.values())

# ═══════════════════════════════════════════════════════════════
# FETCH FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def get_stock_price(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.info
    # Fallback to key 'regularMarketPrice' or 'currentPrice' or 'price' depending on yfinance version/data
    price = info.get('regularMarketPrice') or info.get('currentPrice')
    change = info.get('regularMarketChangePercent')
    volume = info.get('volume') or info.get('regularMarketVolume')
    
    return {
        'symbol': symbol,
        'price': price,
        'change_pct': change,
        'volume': volume
    }

def get_forex_price(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.info
    price = info.get('regularMarketPrice') or info.get('currentPrice')
    change = info.get('regularMarketChangePercent')
    
    return {
        'symbol': symbol,
        'rate': price,
        'change_pct': change
    }

def get_crypto_price(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.info
    price = info.get('regularMarketPrice') or info.get('currentPrice')
    change = info.get('regularMarketChangePercent')
    mcap = info.get('marketCap')

    return {
        'symbol': symbol,
        'price': price,
        'market_cap': mcap,
        'change_pct': change
    }

def get_commodity_price(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.info
    price = info.get('regularMarketPrice') or info.get('currentPrice')
    change = info.get('regularMarketChangePercent')
    
    return {
        'symbol': symbol,
        'price': price,
        'change_pct': change
    }

# Batch Fetch Logic
def get_realtime_dashboard():
    # Optimization: Use yf.download for batch fetching (FASTER & RELIABLE)
    # Segregate by category to avoid dataframe alignment issues (Stocks vs Forex 24/7)
    
    results = {'stocks': {}, 'forex': {}, 'crypto': {}, 'commodities': {}}

    def process_batch(category, symbol_map):
        symbols = list(symbol_map.values())
        names = list(symbol_map.keys())
        if not symbols: return

        with open("py_debug.log", "a") as f: f.write(f"Fetching {category} batch: {len(symbols)} symbols\n")
        
        try:
            # period='5d' to ensure data availability even if market closed
            df = yf.download(symbols, period="5d", interval="1m", progress=False, threads=False)
            
            with open("py_debug.log", "a") as f: f.write(f"{category} Batch Shape: {df.shape}\n")
            
            if df.empty:
                with open("py_debug.log", "a") as f: f.write(f"{category} Batch EMPTY\n")
                # Fallback to defaults
                for name in names:
                     results[category][name] = {'symbol': name, 'error': 'N/A', 'price': 0.0, 'change_pct': 0.0}
                return

            # Extract Close and Open
            is_multi = isinstance(df.columns, pd.MultiIndex)
            with open("py_debug.log", "a") as f: f.write(f"{category} Cols: {df.columns}\n")
            
            # Helper to get series
            try:
                closes = df['Close']
                opens_df = df['Open']
            except KeyError:
                with open("py_debug.log", "a") as f: f.write(f"{category} Batch Missing 'Close' or 'Open' col\n")
                for name in names:
                     results[category][name] = {'symbol': name, 'error': 'NoData', 'price': 0.0, 'change_pct': 0.0}
                return

            for name, sym in symbol_map.items():
                try:
                    price = 0.0
                    change = 0.0
                    
                    # Logic depends on if we have 1 symbol (Series) or multiple (DataFrame)
                    # But yf.download often returns DataFrame even for 1 symbol if we forced it? No.
                    # Safest: Check if sym is in columns.
                    
                    has_data = False
                    
                    if len(symbols) == 1:
                        # If df['Close'] is DataFrame (rare), check columns. If Series, check directly.
                        if isinstance(closes, pd.Series):
                            s_close = closes.dropna()
                            s_open = opens_df.dropna()
                            if not s_close.empty:
                                price = float(s_close.iloc[-1])
                                if not s_open.empty:
                                    open_p = float(s_open.iloc[-1])
                                    change = ((price - open_p)/open_p) if open_p else 0.0
                                has_data = True
                        else:
                            # It is a DF, check if sym in it?
                            if sym in closes.columns:
                                s_close = closes[sym].dropna()
                                if not s_close.empty:
                                    price = float(s_close.iloc[-1])
                                    s_open = opens_df[sym].dropna()
                                    if not s_open.empty:
                                        open_p = float(s_open.iloc[-1])
                                        change = ((price - open_p)/open_p) if open_p else 0.0
                                    has_data = True

                    else:
                        # Multiple symbols
                        if sym in closes.columns:
                            s_close = closes[sym].dropna()
                            if not s_close.empty:
                                price = float(s_close.iloc[-1])
                                s_open = opens_df[sym].dropna()
                                if not s_open.empty: 
                                    open_p = float(s_open.iloc[-1])
                                    change = ((price - open_p)/open_p) if open_p else 0.0
                                has_data = True
                        else:
                            # with open("py_debug.log", "a") as f: f.write(f"Missing {sym} in {category} cols\n")
                            pass

                    if has_data:
                        results[category][name] = {
                            'symbol': name,
                            'ticker': sym,
                            'price': price if category != 'forex' else None,
                            'rate': price if category == 'forex' else None,
                            'change_pct': change
                        }
                    else:
                        results[category][name] = {'symbol': name, 'error': 'N/A', 'price': 0.0, 'change_pct': 0.0}

                except Exception as ex:
                     # with open("py_debug.log", "a") as f: f.write(f"Error parse {sym}: {ex}\n")
                     results[category][name] = {'symbol': name, 'error': 'N/A', 'price': 0.0, 'change_pct': 0.0}

        except Exception as e:
            # with open("py_debug.log", "a") as f: f.write(f"{category} Batch Failed: {e}\n")
            for name in names:
                results[category][name] = {'symbol': name, 'error': 'BatchFail', 'price': 0.0, 'change_pct': 0.0}

    # Execute Batches
    stocks_map = {s: s for s in STOCKS}
    process_batch('stocks', stocks_map)
    process_batch('forex', FOREX)
    process_batch('crypto', CRYPTO)
    process_batch('commodities', COMMODITIES)

    return results

def get_chart_history(symbol: str, period='1mo', interval='1d'):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        if df.empty:
            return []
        
        # Format for TradingView (time must be unix timestamp)
        df.reset_index(inplace=True)
        
        # Ensure Date is converted to simplified format or timestamp
        # TradingView leads usually want unix timestamp in seconds
        records = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']].copy()
        
        # Convert Timestamp to Unix seconds
        # Handle timezone awareness if present
        records['Date'] = records['Date'].apply(lambda x: int(x.timestamp())) if not records.empty else []
        
        # Rename Date to time for Lightweight Charts
        records = records.rename(columns={'Date': 'time', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'})
        
        # Lightweight charts expects lowercase keys
        return records.to_dict('records')
    except Exception as e:
        print(f"Chart history error for {symbol}: {e}")
        return []
