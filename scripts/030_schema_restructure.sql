-- Database Restructure Migration
-- Purpose: Fix schema inconsistencies, remove unused tables, enforce constraints, and improve performance.

BEGIN;

/* =================================================================
   PHASE 1: CLEANUP & INTEGRITY
   Remove legacy artifacts and fix logical constraints.
   ================================================================= */

-- 1. Drop Ghost Table (Verified empty)
DROP TABLE IF EXISTS public.support_tickets;

-- 2. Fix Wallet Uniqueness
-- Remove incorrect constraint (likely on just asset_symbol) if it exists
ALTER TABLE public.wallets 
DROP CONSTRAINT IF EXISTS wallets_asset_symbol_key;

-- Ensure no conflict with existing constraint name before adding
ALTER TABLE public.wallets 
DROP CONSTRAINT IF EXISTS uq_wallets_user_asset;

-- Add correct composite unique constraint
ALTER TABLE public.wallets
ADD CONSTRAINT uq_wallets_user_asset 
UNIQUE (user_id, asset_symbol);


/* =================================================================
   PHASE 2: PERFORMANCE (MISSING INDEXES)
   Add indexes to all unindexed Foreign Keys to support joins.
   ================================================================= */

-- 1. Trades & Orders
CREATE INDEX IF NOT EXISTS idx_trades_asset_id ON public.trades(asset_id);
CREATE INDEX IF NOT EXISTS idx_orders_asset_id ON public.orders(asset_id);

-- 2. Limit Orders & Executions
CREATE INDEX IF NOT EXISTS idx_limit_orders_trading_pair_id ON public.limit_orders(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_trading_pair_id ON public.executed_trades(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_buy_order_id ON public.executed_trades(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_sell_order_id ON public.executed_trades(sell_order_id);

-- 3. Support & Admin
CREATE INDEX IF NOT EXISTS idx_tickets_responded_by ON public.tickets(responded_by);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_ip_address ON public.admin_login_attempts(ip_address);

COMMIT;
