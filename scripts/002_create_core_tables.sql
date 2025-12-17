-- =====================================================
-- BINAPEX CORE DATABASE SCHEMA
-- Phase 4: Trading Platform Tables
-- =====================================================

-- 1. ASSETS TABLE (Tradeable instruments)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) UNIQUE NOT NULL, -- BTC, ETH, EUR/USD, XAU/USD
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('crypto', 'forex', 'commodity', 'stock')),
  current_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  change_24h DECIMAL(10, 2) DEFAULT 0, -- Percentage change
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PLATFORM BANK ACCOUNTS (For deposits)
CREATE TABLE IF NOT EXISTS public.platform_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR(100) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  swift_code VARCHAR(20),
  qr_code_url TEXT, -- DuitNow QR code image URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER BANK ACCOUNTS (User's withdrawal destinations)
CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_number)
);

-- 4. TRANSACTIONS TABLE (Deposits, Withdrawals, Trades)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'trade_profit', 'trade_loss', 'bonus', 'commission')),
  amount DECIMAL(20, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50), -- bank_transfer, crypto, card
  receipt_url TEXT, -- Upload receipt for deposits
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRADES TABLE (Open and closed positions)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')), -- Long or Short
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  size DECIMAL(20, 8) NOT NULL, -- Amount traded
  leverage INTEGER DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 100),
  margin_used DECIMAL(20, 2) NOT NULL,
  profit_loss DECIMAL(20, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXTEND PROFILES TABLE (Add trading-specific fields)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS balance_usd DECIMAL(20, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS bonus_balance DECIMAL(20, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(20) DEFAULT 'silver' CHECK (membership_tier IN ('silver', 'gold', 'platinum', 'diamond')),
  ADD COLUMN IF NOT EXISTS total_trade_volume DECIMAL(20, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_assets_symbol ON public.assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user_id ON public.user_bank_accounts(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Assets: Public read, admin write
CREATE POLICY "Anyone can view active assets"
  ON public.assets FOR SELECT
  USING (is_active = true);

-- Platform Banks: Public read (for deposit instructions)
CREATE POLICY "Anyone can view active bank accounts"
  ON public.platform_bank_accounts FOR SELECT
  USING (is_active = true);

-- User Bank Accounts: Users can only see and manage their own
CREATE POLICY "Users can view their own bank accounts"
  ON public.user_bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts"
  ON public.user_bank_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts"
  ON public.user_bank_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts"
  ON public.user_bank_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions: Users can only see their own
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trades: Users can only see and create their own
CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id);

-- Support Tickets: Users can only see their own
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
