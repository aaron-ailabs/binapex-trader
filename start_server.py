
import uvicorn
import sys
import os

# Add market-service to path so we can import 'main' and 'market_data'
sys.path.append(os.path.join(os.getcwd(), 'market-service'))

if __name__ == "__main__":
    # Import app from main.py
    from main import app
    print("Starting Binapex Market Service via start_server.py...")
    # Use reload=False for stability
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
