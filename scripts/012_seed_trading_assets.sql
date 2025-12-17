-- ============================================
-- SEED 48 TRADING ASSETS
-- ============================================

-- Clear existing trading pairs
DELETE FROM trading_pairs;

-- ============================================
-- FOREX PAIRS (12)
-- ============================================
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, asset_type, display_name, buy_fee_percentage, sell_fee_percentage) VALUES
('USDSGD', 'USD', 'SGD', 'forex', 'US Dollar / Singapore Dollar', 0.0060, 0.0110),
('USDPHP', 'USD', 'PHP', 'forex', 'US Dollar / Philippine Peso', 0.0060, 0.0110),
('USDNZD', 'USD', 'NZD', 'forex', 'US Dollar / New Zealand Dollar', 0.0060, 0.0110),
('USDEUR', 'USD', 'EUR', 'forex', 'US Dollar / Euro', 0.0060, 0.0110),
('USDMYR', 'USD', 'MYR', 'forex', 'US Dollar / Malaysian Ringgit', 0.0060, 0.0110),
('USDAUD', 'USD', 'AUD', 'forex', 'US Dollar / Australian Dollar', 0.0060, 0.0110),
('USDGBP', 'USD', 'GBP', 'forex', 'US Dollar / British Pound', 0.0060, 0.0110),
('USDJPY', 'USD', 'JPY', 'forex', 'US Dollar / Japanese Yen', 0.0060, 0.0110),
('USDTHB', 'USD', 'THB', 'forex', 'US Dollar / Thai Baht', 0.0060, 0.0110),
('USDIDR', 'USD', 'IDR', 'forex', 'US Dollar / Indonesian Rupiah', 0.0060, 0.0110),
('USDHKD', 'USD', 'HKD', 'forex', 'US Dollar / Hong Kong Dollar', 0.0060, 0.0110),
('USDKRW', 'USD', 'KRW', 'forex', 'US Dollar / South Korean Won', 0.0060, 0.0110);

-- ============================================
-- US STOCKS (12)
-- ============================================
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, asset_type, display_name, buy_fee_percentage, sell_fee_percentage) VALUES
('WMT', 'WMT', 'USD', 'stock', 'Walmart', 0.0060, 0.0110),
('AVGO', 'AVGO', 'USD', 'stock', 'Broadcom Inc.', 0.0060, 0.0110),
('GOOGL', 'GOOGL', 'USD', 'stock', 'Alphabet Inc.', 0.0060, 0.0110),
('GOOG', 'GOOG', 'USD', 'stock', 'Google', 0.0060, 0.0110),
('MSFT', 'MSFT', 'USD', 'stock', 'Microsoft Corporation', 0.0060, 0.0110),
('NVDA', 'NVDA', 'USD', 'stock', 'NVIDIA Corporation', 0.0060, 0.0110),
('AMZN', 'AMZN', 'USD', 'stock', 'Amazon.com, Inc.', 0.0060, 0.0110),
('META', 'META', 'USD', 'stock', 'Meta Platforms, Inc.', 0.0060, 0.0110),
('AAPL', 'AAPL', 'USD', 'stock', 'Apple Inc.', 0.0060, 0.0110),
('JPM', 'JPM', 'USD', 'stock', 'JP Morgan Chase & Co.', 0.0060, 0.0110),
('LLY', 'LLY', 'USD', 'stock', 'Eli Lilly and Company', 0.0060, 0.0110),
('TSLA', 'TSLA', 'USD', 'stock', 'Tesla, Inc.', 0.0060, 0.0110);

-- ============================================
-- COMMODITIES (12)
-- ============================================
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, asset_type, display_name, buy_fee_percentage, sell_fee_percentage) VALUES
-- Metals
('GCF', 'GOLD', 'USD', 'commodity', 'COMEX Gold', 0.0060, 0.0110),
('ALIF', 'ALUMINUM', 'USD', 'commodity', 'Aluminum Futures Dec-2025', 0.0060, 0.0110),
('HGF', 'COPPER', 'USD', 'commodity', 'Copper Dec 25', 0.0060, 0.0110),
('PAF', 'PALLADIUM', 'USD', 'commodity', 'Palladium', 0.0060, 0.0110),
('PLF', 'PLATINUM', 'USD', 'commodity', 'Platinum Jan 26', 0.0060, 0.0110),
('SILF', 'SILVER', 'USD', 'commodity', 'Micro Silver Futures Mar-2026', 0.0060, 0.0110),
-- Energy
('BZF', 'BRENT', 'USD', 'commodity', 'Brent Crude Oil', 0.0060, 0.0110),
('CLF', 'CRUDE', 'USD', 'commodity', 'Crude Oil Jan 26', 0.0060, 0.0110),
('NGF', 'NATGAS', 'USD', 'commodity', 'Natural Gas Jan 26', 0.0060, 0.0110),
('RBF', 'RBOB', 'USD', 'commodity', 'RBOB Gasoline Jan 26', 0.0060, 0.0110),
('HOF', 'HEATING', 'USD', 'commodity', 'Heating Oil Feb 26', 0.0060, 0.0110),
-- Agricultural
('KCF', 'COFFEE', 'USD', 'commodity', 'Coffee Futures', 0.0060, 0.0110);

-- ============================================
-- CRYPTOCURRENCIES (12)
-- ============================================
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, asset_type, display_name, buy_fee_percentage, sell_fee_percentage) VALUES
('BTCUSD', 'BTC', 'USD', 'crypto', 'Bitcoin', 0.0060, 0.0110),
('ETHUSD', 'ETH', 'USD', 'crypto', 'Ethereum', 0.0060, 0.0110),
('BCHUSD', 'BCH', 'USD', 'crypto', 'Bitcoin Cash', 0.0060, 0.0110),
('USDTUSD', 'USDT', 'USD', 'crypto', 'Tether USD', 0.0060, 0.0110),
('ETCUSD', 'ETC', 'USD', 'crypto', 'Ethereum Classic', 0.0060, 0.0110),
('UNIUSD', 'UNI', 'USD', 'crypto', 'Uniswap', 0.0060, 0.0110),
('LINKUSD', 'LINK', 'USD', 'crypto', 'Chainlink', 0.0060, 0.0110),
('SOLUSD', 'SOL', 'USD', 'crypto', 'Solana', 0.0060, 0.0110),
('DOGEUSD', 'DOGE', 'USD', 'crypto', 'Dogecoin', 0.0060, 0.0110),
('ADAUSD', 'ADA', 'USD', 'crypto', 'Cardano', 0.0060, 0.0110),
('MATICUSD', 'MATIC', 'USD', 'crypto', 'Polygon', 0.0060, 0.0110),
('LTCUSD', 'LTC', 'USD', 'crypto', 'Litecoin', 0.0060, 0.0110);
