-- Migration: Add create_order RPC
-- Logic: Validates balance, locks funds, inserts order

CREATE OR REPLACE FUNCTION public.create_order(
  p_user_id UUID,
  p_pair VARCHAR,
  p_side VARCHAR, -- 'BUY' or 'SELL'
  p_type VARCHAR, -- 'LIMIT', 'MARKET', 'STOP_LIMIT'
  p_amount DECIMAL,
  p_price DECIMAL, -- Optional for MARKET (assumed execution price estimate? No, usually 0 or null for market)
  p_trigger_price DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_fee_rate DECIMAL;
  v_total_cost DECIMAL;
  v_order_id UUID;
  v_balance DECIMAL;
  v_asset VARCHAR;
  v_locked_amount DECIMAL;
BEGIN
  -- 1. Determine Fee Rate & Asset
  -- Fee Logic: 0.6% BUY, 1.1% SELL (Hardcoded default, or fetch from config/table if available)
  -- User Request: "Fee: 0.6% on BUY orders... 1.1% on SELL orders"
  IF p_side = 'BUY' THEN
    v_fee_rate := 0.006;
  ELSE
    v_fee_rate := 0.011;
  END IF;

  v_asset := split_part(p_pair, '/', 1); -- e.g. BTC from BTC/USD
  IF v_asset = '' THEN v_asset := split_part(p_pair, '-', 1); END IF;

  -- 2. Validate & Lock Funds
  IF p_side = 'BUY' THEN
    -- BUY Logic: Pay in USD.
    -- Cost = (Price * Amount) * (1 + Fee)? Or is Fee deducted from Amount?
    -- User: "Validation: Check if User Balance >= (Amount + Fee). Logic: For BUY (Limit), lock (Price * Amount) * 1.006."
    -- So User pays USD.
    IF p_price IS NULL OR p_price <= 0 THEN
       -- Market Buy: Logic requires estimated price?
       -- If Market Buy, usually we specify 'Total USD' to spend, not 'Amount' of asset?
       -- User: "Order Form Logic ... Percentage Selectors... set Amount input".
       -- If User sets Amount (Asset), we need current price to lock USD.
       -- DB RPC doesn't know current price unless passed.
       -- For MARKET order, `p_price` passed to this RPC should be the "Estimated/Worst" price to lock?
       -- Or should we lock in Route handler?
       -- The User says "Atomic Balance Updates: Use a Supabase RPC".
       -- I will assume for MARKET orders, the Frontend/Route passes an estimated price (e.g. current Ask * 1.05 safety) as `p_price` to lock.
       -- Then `execute_trade` refunds the difference.
       IF p_price IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Price required for locking'); END IF;
    END IF;

    v_total_cost := (p_amount * p_price) * (1 + v_fee_rate);
    
    -- Check USD Balance
    SELECT balance_usd INTO v_balance FROM public.profiles WHERE id = p_user_id;
    IF v_balance < v_total_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient USD balance');
    END IF;

    -- Deduct USD (Locking by deduction, refund later)
    UPDATE public.profiles SET balance_usd = balance_usd - v_total_cost WHERE id = p_user_id;

  ELSE
    -- SELL Logic: Pay in Asset.
    -- Cost = Amount.
    -- Fee is deducted from proceeds (USD) later.
    -- User: "For SELL (Market), deduct Asset amount immediately."
    
    -- Check Asset Balance
    -- 'wallets' table: user_id, asset, balance
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id AND asset = v_asset;
    
    IF v_balance IS NULL OR v_balance < p_amount THEN
       RETURN jsonb_build_object('success', false, 'error', 'Insufficient asset balance');
    END IF;

    -- Move to Locked
    UPDATE public.wallets 
    SET balance = balance - p_amount,
        locked_balance = COALESCE(locked_balance, 0) + p_amount
    WHERE user_id = p_user_id AND asset = v_asset;
  END IF;

  -- 3. Insert Order
  INSERT INTO public.orders (
    user_id, pair, side, type, price, amount, filled_amount, trigger_price, status, fee_rate, created_at
  ) VALUES (
    p_user_id, p_pair, p_side, p_type, p_price, p_amount, 0, p_trigger_price, 'OPEN', v_fee_rate, NOW()
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
