-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. WALLETS TABLE (USD Balance)
create table if not exists public.wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  usd_balance numeric default 0.00 check (usd_balance >= 0),
  locked_balance numeric default 0.00 check (locked_balance >= 0), -- For active Limit orders
  total_volume_traded numeric default 0.00, -- Tracks the 30% withdrawal requirement
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PORTFOLIO TABLE (Asset Holdings)
create table if not exists public.portfolio (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  symbol text not null, -- e.g., 'BTC-USD', 'GOOG'
  amount numeric default 0.00 check (amount >= 0),
  average_buy_price numeric default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, symbol)
);

-- 4. ORDERS TABLE (Order Book & History)
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  type text not null check (type in ('MARKET', 'LIMIT', 'STOP_LIMIT')),
  price numeric, -- Null for MARKET orders initially, or execution price
  amount_usd numeric not null check (amount_usd > 0), -- User inputs USD amount
  fee numeric default 0.00,
  status text default 'OPEN' check (status in ('OPEN', 'FILLED', 'CANCELLED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ENABLE RLS (Security)
alter table public.wallets enable row level security;
alter table public.portfolio enable row level security;
alter table public.orders enable row level security;

-- Policies (Allow users to see only their own data)
-- Safely create policies (drop if exist or use do block, for simplicity using create if not exists style via do block or just simple creates assuming clean slate or overwrites)
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
create policy "Users can view own wallet" on public.wallets for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own portfolio" ON public.portfolio;
create policy "Users can view own portfolio" on public.portfolio for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- 6. ATOMIC MARKET ORDER FUNCTION (The Engine)
-- Handles Balance Deduction, Fee Calculation, and Asset Transfer in ONE transaction.
create or replace function execute_market_order(
  p_user_id uuid,
  p_symbol text,
  p_side text,
  p_amount_usd numeric,
  p_market_price numeric
) returns json as $$
declare
  v_fee_rate numeric;
  v_fee_amount numeric;
  v_net_amount numeric;
  v_asset_qty numeric;
  v_current_balance numeric;
  v_current_asset_amount numeric;
  v_new_order_id uuid;
begin
  -- A. Determine Fee Rate
  if p_side = 'BUY' then
    v_fee_rate := 0.006; -- 0.6%
  else
    v_fee_rate := 0.011; -- 1.1%
  end if;

  -- B. Calculate Fee & Quantities
  v_fee_amount := p_amount_usd * v_fee_rate;
  
  if p_side = 'BUY' then
    -- BUY LOGIC
    -- 1. Check Balance
    select usd_balance into v_current_balance from public.wallets where user_id = p_user_id;
    if v_current_balance < p_amount_usd then
      raise exception 'Insufficient USD Balance';
    end if;

    -- 2. Deduct USD (Total Amount)
    update public.wallets 
    set usd_balance = usd_balance - p_amount_usd,
        total_volume_traded = coalesce(total_volume_traded, 0) + p_amount_usd,
        updated_at = now()
    where user_id = p_user_id;

    -- 3. Calculate Asset Quantity (Net Amount / Price)
    v_net_amount := p_amount_usd - v_fee_amount;
    v_asset_qty := v_net_amount / p_market_price;

    -- 4. Credit Portfolio
    insert into public.portfolio (user_id, symbol, amount, average_buy_price)
    values (p_user_id, p_symbol, v_asset_qty, p_market_price)
    on conflict (user_id, symbol) do update
    set amount = portfolio.amount + excluded.amount,
        average_buy_price = ((portfolio.average_buy_price * portfolio.amount) + (excluded.average_buy_price * excluded.amount)) / (portfolio.amount + excluded.amount);

  else
    -- SELL LOGIC
    -- 1. Calculate Asset Qty needed to sell (Amount USD / Price)
    v_asset_qty := p_amount_usd / p_market_price;

    -- 2. Check Portfolio
    select amount into v_current_asset_amount from public.portfolio where user_id = p_user_id and symbol = p_symbol;
    if v_current_asset_amount is null or v_current_asset_amount < v_asset_qty then
      raise exception 'Insufficient Asset Balance';
    end if;

    -- 3. Deduct Asset
    update public.portfolio
    set amount = amount - v_asset_qty
    where user_id = p_user_id and symbol = p_symbol;

    -- 4. Credit Wallet (Amount USD - Fee)
    v_net_amount := p_amount_usd - v_fee_amount;
    
    update public.wallets
    set usd_balance = usd_balance + v_net_amount,
        total_volume_traded = coalesce(total_volume_traded, 0) + p_amount_usd,
        updated_at = now()
    where user_id = p_user_id;
  end if;

  -- C. Record Order
  insert into public.orders (user_id, symbol, side, type, price, amount_usd, fee, status)
  values (p_user_id, p_symbol, p_side, 'MARKET', p_market_price, p_amount_usd, v_fee_amount, 'FILLED')
  returning id into v_new_order_id;

  return json_build_object('status', 'success', 'order_id', v_new_order_id, 'fee', v_fee_amount);
end;
$$ language plpgsql security definer;
