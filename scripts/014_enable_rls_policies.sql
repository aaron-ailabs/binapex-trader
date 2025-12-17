-- Enable Row Level Security on all tables and create comprehensive security policies

-- Enable RLS on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executed_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create is_admin function FIRST before any policies that use it
-- This SECURITY DEFINER function avoids infinite recursion by checking the role in a separate security context
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Profiles policies - users can always see/update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can view all profiles (uses security definer function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admin can update all profiles (uses security definer function to avoid recursion)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Wallets policies
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Service role can manage wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;

CREATE POLICY "Users can view their own wallets"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service role can manage wallets"
  ON public.wallets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trading pairs policies (read-only for users)
DROP POLICY IF EXISTS "Anyone can view active trading pairs" ON public.trading_pairs;
DROP POLICY IF EXISTS "Service role can manage trading pairs" ON public.trading_pairs;

CREATE POLICY "Anyone can view active trading pairs"
  ON public.trading_pairs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage trading pairs"
  ON public.trading_pairs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Limit orders policies
DROP POLICY IF EXISTS "Users can view their own limit orders" ON public.limit_orders;
DROP POLICY IF EXISTS "Users can create their own limit orders" ON public.limit_orders;
DROP POLICY IF EXISTS "Users can cancel their own pending limit orders" ON public.limit_orders;

CREATE POLICY "Users can view their own limit orders"
  ON public.limit_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own limit orders"
  ON public.limit_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own pending limit orders"
  ON public.limit_orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'partially_filled'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE POLICY "Admins can view all limit orders"
  ON public.limit_orders FOR SELECT
  USING (public.is_admin());

-- Executed trades policies
DROP POLICY IF EXISTS "Users can view their own executed trades" ON public.executed_trades;
DROP POLICY IF EXISTS "Service role can create executed trades" ON public.executed_trades;

CREATE POLICY "Users can view their own executed trades"
  ON public.executed_trades FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Service role can create executed trades"
  ON public.executed_trades FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view all executed trades"
  ON public.executed_trades FOR SELECT
  USING (public.is_admin());

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Trades policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Service role can manage trades" ON public.trades;

CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage trades"
  ON public.trades FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view all trades"
  ON public.trades FOR SELECT
  USING (public.is_admin());

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all transactions"
  ON public.transactions FOR UPDATE
  USING (public.is_admin());

-- Credit score history policies
DROP POLICY IF EXISTS "Users can view their own credit score history" ON public.credit_score_history;
DROP POLICY IF EXISTS "Admins can manage credit scores" ON public.credit_score_history;

CREATE POLICY "Users can view their own credit score history"
  ON public.credit_score_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage credit scores"
  ON public.credit_score_history FOR ALL
  USING (public.is_admin());

-- Admin logs policies
DROP POLICY IF EXISTS "Only admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Only admins can create admin logs" ON public.admin_logs;

CREATE POLICY "Only admins can view admin logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can create admin logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (public.is_admin());
