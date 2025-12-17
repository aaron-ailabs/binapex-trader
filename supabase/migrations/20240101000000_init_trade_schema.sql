-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('forex', 'stock', 'commodity', 'crypto')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tickers table
CREATE TABLE IF NOT EXISTS public.tickers (
    asset_id UUID PRIMARY KEY REFERENCES public.assets(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    change_24h NUMERIC DEFAULT 0,
    volume_24h NUMERIC DEFAULT 0,
    high_24h NUMERIC DEFAULT 0,
    low_24h NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create candles table (timescaleDB style or simple for now)
CREATE TABLE IF NOT EXISTS public.candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    resolution TEXT NOT NULL, -- '1m', '5m', '1h', '1d'
    timestamp TIMESTAMPTZ NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume NUMERIC DEFAULT 0,
    UNIQUE(asset_id, resolution, timestamp)
);

-- Create trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    size NUMERIC NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    type TEXT NOT NULL CHECK (type IN ('market', 'limit')),
    price NUMERIC, -- NULL for market orders
    size NUMERIC NOT NULL,
    leverage NUMERIC DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- create RLS policies
-- Public Read Access
CREATE POLICY "Public read assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Public read tickers" ON public.tickers FOR SELECT USING (true);
CREATE POLICY "Public read candles" ON public.candles FOR SELECT USING (true);
CREATE POLICY "Public read trades" ON public.trades FOR SELECT USING (true);

-- Orders: Users can see their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Orders: Function/Admin driven insertion (usually done via service role in Edge Functions, but allowing auth users to insert if we want direct calls, although plan says Edge Function)
-- We will keep orders restricted for now, assuming Edge Function uses service role or we add a policy for authenticated users if needed.
-- Let's allow authenticated users to INSERT their own orders for now, ensuring user_id matches.
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- Realtime publication
-- Note: 'supabase_realtime' publication usually exists. We add tables to it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tickers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
