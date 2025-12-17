
import yfinance as yf
import time

symbols = ['BTC-USD', 'EURUSD=X', 'AAPL', 'GC=F']

def test_info():
    start = time.time()
    for s in symbols:
        try:
            t = yf.Ticker(s)
            _ = t.info.get('regularMarketPrice')
        except Exception as e:
            print(f"Info Error {s}: {e}")
    print(f"Info took: {time.time() - start:.2f}s")

def test_fast_info():
    start = time.time()
    for s in symbols:
        try:
            t = yf.Ticker(s)
            price = t.fast_info.last_price
            print(f"{s} Fast Price: {price}")
        except Exception as e:
            print(f"Fast Info Error {s}: {e}")
    print(f"Fast Info took: {time.time() - start:.2f}s")

def test_download():
    start = time.time()
    try:
        data = yf.download(symbols, period='1d', interval='1m', progress=False)
        print("Download Shape:", data.shape)
        # Check latest prices
        print(data['Close'].iloc[-1])
    except Exception as e:
        print(f"Download Error: {e}")
    print(f"Download took: {time.time() - start:.2f}s")

if __name__ == "__main__":
    # print("Testing .info (SKIP due to slowness expectancy)...")
    # test_info() 
    print("\nTesting .fast_info...")
    test_fast_info()
    print("\nTesting .download...")
    test_download()
