-- Migration to seed 48 initial assets

DO $$
DECLARE
    v_asset_id UUID;
BEGIN
    -- FOREX (12)
    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('SGD=X', 'USD/SGD', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1.29) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('PHP=X', 'USD/PHP', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 59.06) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('NZD=X', 'USD/NZD', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1.72) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('EUR=X', 'USD/EUR', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 0.85) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('MYR=X', 'USD/MYR', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 4.09) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('AUD=X', 'USD/AUD', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1.50) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('GBP=X', 'USD/GBP', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 0.75) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('JPY=X', 'USD/JPY', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 155.75) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('THB=X', 'USD/THB', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 31.56) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('IDR=X', 'USD/IDR', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 16635.00) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('HKD=X', 'USD/HKD', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 7.78) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('KRW=X', 'USD/KRW', 'forex', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1477.30) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;


    -- STOCKS (12)
    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('WMT', 'Walmart', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 116.70) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('AVGO', 'Broadcom Inc.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 359.93) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('GOOGL', 'Alphabet Inc.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 309.29) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('GOOG', 'Google', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 310.52) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('MSFT', 'Microsoft Corp.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 478.53) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('NVDA', 'NVIDIA Corp.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 175.02) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('AMZN', 'Amazon.com, Inc.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 226.19) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('META', 'Meta Platforms, Inc.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 644.23) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('AAPL', 'Apple Inc.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 278.28) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('JPM', 'JP Morgan Chase', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 318.52) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('LLY', 'Eli Lilly and Company', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1027.51) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('TSLA', 'Tesla, Inc.', 'stock', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 458.96) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;


    -- COMMODITIES (12)
    -- Metals
    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('GC=F', 'COMEX Gold', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 4328.30) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('ALI=F', 'Aluminum Futures', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 2855.75) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('HG=F', 'Copper', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 5.36) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('PA=F', 'Palladium', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1542.70) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('PL=F', 'Platinum', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1762.50) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('SIL=F', 'Micro Silver', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 62.01) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    -- Energy
    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('BZ=F', 'Brent Crude Oil', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 61.12) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('CL=F', 'Crude Oil', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 57.44) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('NG=F', 'Natural Gas', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 4.11) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('RB=F', 'RBOB Gasoline', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1.75) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('HO=F', 'Heating Oil', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 2.19) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    -- Other
    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('KC=F', 'Coffee Futures', 'commodity', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 369.55) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;


    -- CRYPTOCURRENCIES (12)
    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('BTC-USD', 'Bitcoin', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 90349.22) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('ETH-USD', 'Ethereum', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 3111.66) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('BCH-USD', 'Bitcoin Cash', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 576.38) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('USDT-USD', 'Tether USD', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 1.00) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('ETC-USD', 'Ethereum Classic', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 13.19) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('UNI7083-USD', 'Uniswap', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 5.45) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('LINK-USD', 'Chainlink', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 13.76) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('SOL-USD', 'Solana', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 133.01) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('DOGE-USD', 'Dogecoin', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 0.14) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('ADA-USD', 'Cardano', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 0.41) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('MATIC-USD', 'Polygon', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 0.22) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

    INSERT INTO public.assets (symbol, name, type, is_active) VALUES ('LTC-USD', 'Litecoin', 'crypto', true) ON CONFLICT (symbol) DO UPDATE SET is_active = true RETURNING id INTO v_asset_id;
    INSERT INTO public.tickers (asset_id, price) VALUES (v_asset_id, 81.65) ON CONFLICT (asset_id) DO UPDATE SET price = EXCLUDED.price;

END $$;
