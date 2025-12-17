-- ============================================
-- BINAPEX CONSOLIDATED SCHEMA (REFACOR)
-- ============================================

-- 1. BASE TABLES & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILE & AUTH EXTENSIONS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  ADD COLUMN IF NOT EXISTS balance_usd DECIMAL(20, 8) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS bonus_balance DECIMAL(20, 8) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(20) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS total_trade_volume DECIMAL(28, 8) DEFAULT 0.00;

-- 3. ASSETS & WALLETS (For multi-asset support)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'crypto', 'forex', 'stock', 'commodity'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol VARCHAR(20) NOT NULL,
  available_balance DECIMAL(28, 10) DEFAULT 0.00,
  locked_balance DECIMAL(28, 10) DEFAULT 0.00,
  total_balance DECIMAL(28, 10) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_asset UNIQUE(user_id, asset_symbol),
  CONSTRAINT positive_balances CHECK (available_balance >= 0 AND locked_balance >= 0)
);

-- 4. TRADING SYSTEM
CREATE TABLE IF NOT EXISTS public.trading_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'BTC-USD'
  base_asset VARCHAR(10) NOT NULL,
  quote_asset VARCHAR(10) NOT NULL,
  asset_type VARCHAR(20) NOT NULL,
  buy_fee_percentage DECIMAL(5, 4) DEFAULT 0.0060,
  sell_fee_percentage DECIMAL(5, 4) DEFAULT 0.0110,
  last_price DECIMAL(18, 8) DEFAULT 0.00,
  precision_price INTEGER DEFAULT 2,
  precision_amount INTEGER DEFAULT 8,
  min_order_amount DECIMAL(18, 8) DEFAULT 0.0001,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.limit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trading_pair_id UUID REFERENCES public.trading_pairs(id) ON DELETE CASCADE NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  type VARCHAR(10) NOT NULL DEFAULT 'limit' CHECK (type IN ('limit', 'market', 'stop_limit')),
  price DECIMAL(18, 8), -- NULL for market orders
  amount DECIMAL(18, 8) NOT NULL,
  filled_amount DECIMAL(18, 8) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partially_filled', 'filled', 'cancelled', 'rejected')),
  fee_percentage DECIMAL(5, 4) NOT NULL,
  total_fee DECIMAL(18, 8) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.executed_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order_id UUID REFERENCES public.limit_orders(id),
  sell_order_id UUID REFERENCES public.limit_orders(id),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  trading_pair_id UUID REFERENCES public.trading_pairs(id),
  price DECIMAL(18, 8) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  buyer_fee DECIMAL(18, 8) NOT NULL,
  seller_fee DECIMAL(18, 8) NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BANKING & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'bonus', 'commission', 'balance_adjustment')),
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50),
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUTO TRADE & EXCHANGE RATES
CREATE TABLE IF NOT EXISTS public.auto_trade_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  allocation_amount DECIMAL(20, 8) DEFAULT 0.00,
  strategy_id VARCHAR(50) DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auto_trade_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(10) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  status VARCHAR(20) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- 7. ATOMIC RPC FUNCTIONS

-- is_admin helper
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- place_order_atomic
DROP FUNCTION IF EXISTS public.place_order_atomic(UUID, UUID, VARCHAR, DECIMAL, DECIMAL, VARCHAR);
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_user_id UUID,
  p_trading_pair_id UUID,
  p_side VARCHAR(10),
  p_price DECIMAL,
  p_amount DECIMAL,
  p_type VARCHAR(10)
) RETURNS JSON AS $$
DECLARE
  v_fee_rate DECIMAL;
  v_total_cost DECIMAL;
  v_order_id UUID;
  v_pair_symbol VARCHAR(20);
BEGIN
  -- Get Trading Pair Details
  SELECT symbol, buy_fee_percentage, sell_fee_percentage 
  INTO v_pair_symbol, v_fee_rate, v_fee_rate -- reused variable for simplicity in selection
  FROM public.trading_pairs WHERE id = p_trading_pair_id;

  IF v_pair_symbol IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid trading pair');
  END IF;

  -- Re-assign correct fee rate
  IF p_side = 'buy' THEN
    SELECT buy_fee_percentage INTO v_fee_rate FROM public.trading_pairs WHERE id = p_trading_pair_id;
  ELSE
    SELECT sell_fee_percentage INTO v_fee_rate FROM public.trading_pairs WHERE id = p_trading_pair_id;
  END IF;

  -- Logic for Buy Order (Locks USD Balance in profiles)
  IF p_side = 'buy' THEN
    v_total_cost := p_amount * p_price;
    
    -- Check Balance
    IF (SELECT balance_usd FROM public.profiles WHERE id = p_user_id) < v_total_cost THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient USD balance');
    END IF;

    -- Deduct Balance
    UPDATE public.profiles SET balance_usd = balance_usd - v_total_cost WHERE id = p_user_id;

  -- Logic for Sell Order (Locks asset in wallets)
  ELSE
    IF (SELECT available_balance FROM public.wallets WHERE user_id = p_user_id AND asset_symbol = split_part(v_pair_symbol, '-', 1)) < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient asset balance');
    END IF;

    -- Lock Asset
    UPDATE public.wallets 
    SET available_balance = available_balance - p_amount,
        locked_balance = locked_balance + p_amount
    WHERE user_id = p_user_id AND asset_symbol = split_part(v_pair_symbol, '-', 1);
  END IF;

  -- Insert Order
  -- CHANGED: status = 'pending'
  INSERT INTO public.limit_orders (user_id, trading_pair_id, side, type, price, amount, remaining_amount, status, fee_percentage)
  VALUES (p_user_id, p_trading_pair_id, p_side, p_type, p_price, p_amount, p_amount, 'pending', v_fee_rate)
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_order_atomic
DROP FUNCTION IF EXISTS public.cancel_order_atomic(UUID, UUID);
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(p_order_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_refund_usd NUMERIC;
  v_base_currency TEXT;
BEGIN
  SELECT * INTO v_order FROM public.limit_orders WHERE id = p_order_id AND user_id = p_user_id FOR UPDATE;
  
  IF v_order IS NULL THEN
     RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.status IN ('filled', 'cancelled') THEN
     RETURN jsonb_build_object('success', false, 'error', 'Order already final');
  END IF;

  UPDATE public.limit_orders SET status = 'cancelled', updated_at = NOW() WHERE id = p_order_id;

  IF v_order.side = 'buy' THEN
     -- Refund USD
     v_refund_usd := (v_order.amount - v_order.filled_amount) * v_order.price;
     UPDATE public.profiles SET balance_usd = balance_usd + v_refund_usd WHERE id = p_user_id;

  ELSIF v_order.side = 'sell' THEN
     -- Unlock Asset
     SELECT base_currency INTO v_base_currency FROM public.trading_pairs WHERE id = v_order.trading_pair_id;
     UPDATE public.wallets 
     SET available_balance = available_balance + (v_order.amount - v_order.filled_amount),
         locked_balance = locked_balance - (v_order.amount - v_order.filled_amount),
         updated_at = NOW()
     WHERE user_id = p_user_id AND asset_symbol = v_base_currency;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- execute_trade_atomic
DROP FUNCTION IF EXISTS public.execute_trade_atomic(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, UUID, UUID, UUID);
CREATE OR REPLACE FUNCTION public.execute_trade_atomic(
  p_buy_order_id UUID, 
  p_sell_order_id UUID, 
  p_match_amount NUMERIC, 
  p_execution_price NUMERIC, 
  p_buyer_fee NUMERIC, 
  p_seller_fee NUMERIC, 
  p_buyer_id UUID, 
  p_seller_id UUID, 
  p_trading_pair_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_trade_id UUID;
  v_base_currency TEXT;
  v_total_value NUMERIC;
  v_buy_order_price NUMERIC;
  v_locked_amount NUMERIC;
  v_refund_amount NUMERIC;
  v_buyer_asset_credit NUMERIC;
BEGIN
  v_total_value := p_match_amount * p_execution_price;
  
  -- Insert Trade Record
  INSERT INTO public.executed_trades (
    buyer_id, seller_id, trading_pair_id, price, amount, buyer_fee, seller_fee
  ) VALUES (
    p_buyer_id, p_seller_id, p_trading_pair_id, p_execution_price, p_match_amount, p_buyer_fee, p_seller_fee
  ) RETURNING id INTO v_trade_id;

  SELECT base_currency INTO v_base_currency FROM public.trading_pairs WHERE id = p_trading_pair_id;
  
  -- === BUYER LOGIC ===
  -- 1. Get original Limit Price from Order to calculate locked amount refund
  SELECT price INTO v_buy_order_price FROM public.limit_orders WHERE id = p_buy_order_id;
  
  v_locked_amount := p_match_amount * v_buy_order_price;
  v_refund_amount := v_locked_amount - v_total_value;
  
  IF v_refund_amount > 0 THEN
      UPDATE public.profiles 
      SET balance_usd = balance_usd + v_refund_amount 
      WHERE id = p_buyer_id;
  END IF;

  -- 2. Credit Asset to Buyer's Wallet
  v_buyer_asset_credit := p_match_amount - (p_buyer_fee / p_execution_price);

  INSERT INTO public.wallets (user_id, asset_symbol, available_balance)
  VALUES (p_buyer_id, v_base_currency, v_buyer_asset_credit)
  ON CONFLICT (user_id, asset_symbol)
  DO UPDATE SET 
    available_balance = wallets.available_balance + EXCLUDED.available_balance,
    updated_at = NOW();
    
  -- === SELLER LOGIC ===
  UPDATE public.wallets 
  SET locked_balance = locked_balance - p_match_amount,
      updated_at = NOW()
  WHERE user_id = p_seller_id AND asset_symbol = v_base_currency;

  -- 2. Credit USD to Seller
  UPDATE public.profiles 
  SET balance_usd = balance_usd + (v_total_value - p_seller_fee)
  WHERE id = p_seller_id;

  -- === UPDATE ORDERS ===
  UPDATE public.limit_orders
  SET 
    filled_amount = filled_amount + p_match_amount,
    remaining_amount = remaining_amount - p_match_amount,
    status = CASE WHEN remaining_amount - p_match_amount <= 1e-10 THEN 'filled' ELSE 'partially_filled' END,
    updated_at = NOW()
  WHERE id = p_buy_order_id;

  UPDATE public.limit_orders
  SET 
    filled_amount = filled_amount + p_match_amount,
    remaining_amount = remaining_amount - p_match_amount,
    status = CASE WHEN remaining_amount - p_match_amount <= 1e-10 THEN 'filled' ELSE 'partially_filled' END,
    updated_at = NOW()
  WHERE id = p_sell_order_id;
  
  RETURN jsonb_build_object('success', true, 'trade_id', v_trade_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- request_withdrawal_atomic
DROP FUNCTION IF EXISTS public.request_withdrawal_atomic(UUID, DECIMAL, UUID);
CREATE OR REPLACE FUNCTION public.request_withdrawal_atomic(
  p_user_id UUID,
  p_amount DECIMAL,
  p_bank_account_id UUID
) RETURNS JSON AS $$
DECLARE
  v_current_balance DECIMAL;
BEGIN
  -- Check Balance
  SELECT balance_usd INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
  
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct Balance
  UPDATE public.profiles SET balance_usd = balance_usd - p_amount WHERE id = p_user_id;

  -- Create Transaction record
  INSERT INTO public.transactions (user_id, type, amount, status, metadata)
  VALUES (p_user_id, 'withdraw', p_amount, 'pending', jsonb_build_object('bank_account_id', p_bank_account_id));

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- deduct_balance
DROP FUNCTION IF EXISTS public.deduct_balance(UUID, DECIMAL);
CREATE OR REPLACE FUNCTION public.deduct_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  UPDATE public.profiles
  SET balance_usd = balance_usd - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance_usd INTO v_new_balance;
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- add_balance
DROP FUNCTION IF EXISTS public.add_balance(UUID, DECIMAL);
CREATE OR REPLACE FUNCTION public.add_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  UPDATE public.profiles
  SET balance_usd = balance_usd + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance_usd INTO v_new_balance;
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
