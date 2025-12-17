
import sys
import os

# Add market-service to path
sys.path.append(os.path.join(os.getcwd(), 'market-service'))

try:
    from market_data import get_realtime_dashboard
    print("Import successful. Running get_realtime_dashboard()...")
    data = get_realtime_dashboard()
    print("Execution successful.")
    import json
    # Print keys and first stock price to verify
    print("Keys:", data.keys())
    if 'stocks' in data and data['stocks']:
        first_stock = list(data['stocks'].keys())[0]
        print(f"Sample Stock {first_stock}:", data['stocks'][first_stock])
    else:
        print("Stocks data is empty.")
        
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
