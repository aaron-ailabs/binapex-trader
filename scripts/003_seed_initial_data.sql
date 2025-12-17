-- =====================================================
-- SEED DATA FOR BINAPEX PLATFORM
-- =====================================================

-- 1. INSERT TRADEABLE ASSETS
INSERT INTO public.assets (symbol, name, type, current_price, change_24h) VALUES
  ('BTC/USD', 'Bitcoin', 'crypto', 98500.00, 2.34),
  ('ETH/USD', 'Ethereum', 'crypto', 3420.50, 1.82),
  ('XRP/USD', 'Ripple', 'crypto', 0.6234, -0.45),
  ('EUR/USD', 'Euro / US Dollar', 'forex', 1.0945, 0.12),
  ('GBP/USD', 'British Pound / US Dollar', 'forex', 1.2678, -0.23),
  ('USD/JPY', 'US Dollar / Japanese Yen', 'forex', 148.32, 0.08),
  ('XAU/USD', 'Gold', 'commodity', 2034.50, 1.12),
  ('XAG/USD', 'Silver', 'commodity', 24.32, 0.78),
  ('WTI/USD', 'Crude Oil WTI', 'commodity', 72.45, -1.23),
  ('AAPL', 'Apple Inc.', 'stock', 187.23, 0.95),
  ('TSLA', 'Tesla Inc.', 'stock', 234.56, 3.21),
  ('GOOGL', 'Alphabet Inc.', 'stock', 142.34, 1.45)
ON CONFLICT (symbol) DO NOTHING;

-- 2. INSERT PLATFORM BANK ACCOUNTS (Malaysian banks)
INSERT INTO public.platform_bank_accounts (bank_name, account_name, account_number, qr_code_url) VALUES
  ('Maybank', 'BINAPEX SDN BHD', '562345678901', '/placeholder.svg?height=200&width=200'),
  ('CIMB Bank', 'BINAPEX SDN BHD', '8001234567890', '/placeholder.svg?height=200&width=200'),
  ('Public Bank', 'BINAPEX SDN BHD', '4123456789012', '/placeholder.svg?height=200&width=200')
ON CONFLICT DO NOTHING;

-- Note: User-specific data (transactions, trades, etc.) will be created through the application
