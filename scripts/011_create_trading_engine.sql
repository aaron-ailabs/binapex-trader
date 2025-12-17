-- ============================================
-- BINAPEX TRADING ENGINE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol VARCHAR(20) NOT NULL,  -- BTC, ETH, USD, etc.
  asset_type VARCHAR(20) NOT NULL, -- crypto, forex, stock, commodity, fiat
  available_balance DECIMAL(28, 10) DEFAULT 0.00,
  locked_balance DECIMAL(28, 10) DEFAULT 0.00,  -- In open orders
  total_balance DECIMAL(28, 10) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_asset UNIQUE(user_id, asset_symbol),
  CONSTRAINT positive_balances CHECK (available_balance >= 0 AND locked_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- ============================================
-- TRADING PAIRS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trading_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) UNIQUE NOT NULL,  -- BTCUSD, ETHUSD, etc.
  base_asset VARCHAR(10) NOT NULL,  -- BTC, ETH
  quote_asset VARCHAR(10) NOT NULL,  -- USD, USDT
  asset_type VARCHAR(20) NOT NULL, -- crypto, forex, stock, commodity
  
  min_order_amount DECIMAL(18, 8) DEFAULT 0.0001,
  max_order_amount DECIMAL(18, 8) DEFAULT 1000000,
  price_precision INT DEFAULT 2,
  amount_precision INT DEFAULT 8,
  
  buy_fee_percentage DECIMAL(5, 4) DEFAULT 0.0060,  -- 0.6%
  sell_fee_percentage DECIMAL(5, 4) DEFAULT 0.0110,  -- 1.1%
  
  is_active BOOLEAN DEFAULT true,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_type ON trading_pairs(asset_type);

-- ============================================
-- LIMIT ORDERS TABLE (replaces pending_orders)
-- ============================================
DROP TABLE IF EXISTS pending_orders;

CREATE TABLE IF NOT EXISTS limit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  
  order_type VARCHAR(20) NOT NULL, -- market, limit, stop_limit
  side VARCHAR(10) NOT NULL, -- buy, sell
  
  price DECIMAL(18, 8),  -- NULL for market orders
  stop_price DECIMAL(18, 8),  -- For stop_limit orders
  amount DECIMAL(18, 8) NOT NULL,
  filled_amount DECIMAL(18, 8) DEFAULT 0.00,
  remaining_amount DECIMAL(18, 8) GENERATED ALWAYS AS (amount - filled_amount) STORED,
  
  status VARCHAR(20) DEFAULT 'open', -- open, partially_filled, filled, canceled, rejected
  
  fee_percentage DECIMAL(5, 4) NOT NULL,
  total_fee DECIMAL(18, 8) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_order_type CHECK (order_type IN ('market', 'limit', 'stop_limit')),
  CONSTRAINT valid_side CHECK (side IN ('buy', 'sell')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'partially_filled', 'filled', 'canceled', 'rejected')),
  CONSTRAINT positive_amounts CHECK (amount > 0 AND filled_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_limit_orders_user_id ON limit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_trading_pair ON limit_orders(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);
CREATE INDEX IF NOT EXISTS idx_limit_orders_created_at ON limit_orders(created_at DESC);

-- ============================================
-- EXECUTED TRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS executed_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  buy_order_id UUID NOT NULL REFERENCES limit_orders(id),
  sell_order_id UUID NOT NULL REFERENCES limit_orders(id),
  
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  
  trading_pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  
  price DECIMAL(18, 8) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  total DECIMAL(18, 8) GENERATED ALWAYS AS (price * amount) STORED,
  
  buyer_fee DECIMAL(18, 8) NOT NULL,
  seller_fee DECIMAL(18, 8) NOT NULL,
  
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_trade_values CHECK (price > 0 AND amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_executed_trades_buyer ON executed_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_seller ON executed_trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_trading_pair ON executed_trades(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_executed_at ON executed_trades(executed_at DESC);

-- ============================================
-- ORDER BOOK MATERIALIZED VIEW
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS order_book AS
SELECT 
  trading_pair_id,
  side,
  price,
  SUM(remaining_amount) as total_amount,
  COUNT(*) as order_count
FROM limit_orders
WHERE status IN ('open', 'partially_filled')
GROUP BY trading_pair_id, side, price
ORDER BY 
  trading_pair_id,
  side,
  CASE WHEN side = 'sell' THEN price END ASC,
  CASE WHEN side = 'buy' THEN price END DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_book_unique ON order_book(trading_pair_id, side, price);
CREATE INDEX IF NOT EXISTS idx_order_book_pair ON order_book(trading_pair_id);
