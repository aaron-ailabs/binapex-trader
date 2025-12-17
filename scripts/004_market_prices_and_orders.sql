-- Create market_prices table for real-time price data
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  price DECIMAL(20, 8) NOT NULL,
  bid_price DECIMAL(20, 8) NOT NULL,
  ask_price DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(20, 2) DEFAULT 0,
  change_24h DECIMAL(10, 4) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_market_prices_asset_id ON public.market_prices(asset_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_timestamp ON public.market_prices(timestamp DESC);

-- Create unique index to prevent duplicate entries (one row per asset, updated in place)
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_prices_asset_unique ON public.market_prices(asset_id);

-- Enable RLS
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Public can read market prices
CREATE POLICY "Anyone can view market prices"
ON public.market_prices FOR SELECT
USING (true);

-- Only service role can insert/update (via Edge Functions)
CREATE POLICY "Service role can manage market prices"
ON public.market_prices FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create orders table (separate from trades for order history)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
  entry_price DECIMAL(20, 8) NOT NULL,
  executed_price DECIMAL(20, 8) NOT NULL, -- Actual execution price with slippage
  size DECIMAL(20, 8) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  margin_used DECIMAL(20, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'filled' CHECK (status IN ('filled', 'cancelled', 'rejected')),
  slippage_applied DECIMAL(10, 6) DEFAULT 0, -- Track slippage percentage
  risk_mode TEXT NOT NULL DEFAULT 'standard' CHECK (risk_mode IN ('standard', 'winning', 'losing')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can only view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert orders (via Edge Function)
CREATE POLICY "Service role can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Update trades table to disable client inserts
DROP POLICY IF EXISTS "Users can create their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;

-- Only service role can manage trades
CREATE POLICY "Service role can manage trades"
ON public.trades FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add risk_mode column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'risk_mode'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN risk_mode TEXT DEFAULT 'standard' CHECK (risk_mode IN ('standard', 'winning', 'losing'));
  END IF;
END $$;

-- Function to get latest market price
CREATE OR REPLACE FUNCTION get_latest_price(p_asset_id UUID)
RETURNS DECIMAL AS $$
  SELECT price FROM public.market_prices WHERE asset_id = p_asset_id LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Admin view for monitoring
CREATE OR REPLACE VIEW admin_open_positions AS
SELECT 
  t.id,
  t.user_id,
  p.email,
  p.full_name,
  p.risk_mode,
  a.symbol,
  a.name as asset_name,
  t.type,
  t.entry_price,
  mp.price as current_price,
  t.size,
  t.leverage,
  t.margin_used,
  CASE 
    WHEN t.type = 'buy' THEN (mp.price - t.entry_price) * t.size
    WHEN t.type = 'sell' THEN (t.entry_price - mp.price) * t.size
  END as unrealized_pnl,
  CASE 
    WHEN t.type = 'buy' THEN ((mp.price - t.entry_price) * t.size) / t.margin_used * 100
    WHEN t.type = 'sell' THEN ((t.entry_price - mp.price) * t.size) / t.margin_used * 100
  END as pnl_percentage,
  t.opened_at
FROM public.trades t
JOIN public.profiles p ON t.user_id = p.id
JOIN public.assets a ON t.asset_id = a.id
JOIN public.market_prices mp ON a.id = mp.asset_id
WHERE t.status = 'open'
ORDER BY t.opened_at DESC;

COMMENT ON TABLE public.market_prices IS 'Real-time market price data updated by Edge Functions';
COMMENT ON TABLE public.orders IS 'Order execution history with slippage tracking';
COMMENT ON VIEW admin_open_positions IS 'Admin view of all open positions with P&L';
