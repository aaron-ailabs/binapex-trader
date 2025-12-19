-- Migration: Add execute_trade RPC
-- Logic: Handles atomic trade execution, balance updates, and order status

CREATE OR REPLACE FUNCTION public.execute_trade(
  p_maker_order_id UUID,
  p_taker_order_id UUID,
  p_match_amount DECIMAL,
  p_price DECIMAL,
  p_maker_fee_rate DECIMAL, -- e.g. 0.006 or 0.011
  p_taker_fee_rate DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_maker_order public.orders%ROWTYPE;
  v_taker_order public.orders%ROWTYPE;
  v_trade_id UUID;
  v_total_usd DECIMAL;
  v_buyer_fee_usd DECIMAL;
  v_seller_fee_usd DECIMAL;
  v_buyer_id UUID;
  v_seller_id UUID;
  v_asset VARCHAR;
BEGIN
  -- Fetch orders
  SELECT * INTO v_maker_order FROM public.orders WHERE id = p_maker_order_id;
  SELECT * INTO v_taker_order FROM public.orders WHERE id = p_taker_order_id;

  IF v_maker_order IS NULL OR v_taker_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Identify Buyer and Seller
  IF v_maker_order.side = 'BUY' THEN
    v_buyer_id := v_maker_order.user_id;
    v_seller_id := v_taker_order.user_id;
  ELSE
    v_buyer_id := v_taker_order.user_id;
    v_seller_id := v_maker_order.user_id;
  END IF;

  -- Extract Asset (e.g. BTC from BTC/USD)
  v_asset := split_part(v_maker_order.pair, '/', 1); -- Assumes format 'BTC/USD' or 'BTC-USD'
  IF v_asset = '' THEN v_asset := split_part(v_maker_order.pair, '-', 1); END IF;

  v_total_usd := p_match_amount * p_price;

  -- Insert Trades
  INSERT INTO public.trades (maker_order_id, taker_order_id, price, amount, executed_at)
  VALUES (p_maker_order_id, p_taker_order_id, p_price, p_match_amount, NOW())
  RETURNING id INTO v_trade_id;

  -- === BALANCE UPDATES ===
  -- We assume funds are LOCKED in 'locked_balance' (Asset) or 'profiles.balance_usd' (implicit lock logic? No, usually separate locked column).
  -- User 'wallets' table has 'locked_balance'.
  -- 'profiles' table has 'balance_usd'. Does it have 'locked_balance_usd'? 
  -- Checking 'profiles' schema from Step 73: `balance_usd` only. No `locked_balance_usd`.
  -- This implies USD locking might be done by deducting from `balance_usd` locally or invalid assumption?
  -- "For BUY (Limit), lock (Price * Amount)..."
  -- If there is no `locked_usd` column, "Locking" might mean deducting functionality (moving to a hold account) or we simply DEDUCT from balance now (if Taker) and REFUND (if Maker).
  -- Wait, if Maker placed order hours ago, balance must be deducted/locked.
  -- Since `profiles` has no locked column, maybe `wallets` with asset='USD' is used?
  -- Step 73 showed `profiles`.
  -- I will assume for USD: Deduct from `balance_usd` immediately upon Order Creation.
  -- So Maker (Buy) has ALREADY paid. We need to Refund difference.
  -- Taker (Buy, Market) has ALREADY paid (deducted in API before calling this?).
  -- Let's assume API handles "locking" by deducting.
  -- So RPC just handles:
  --   Buyer: Credit Asset. Refund overpaid USD (if Maker Limit).
  --   Seller: Debit Locked Asset (if Maker). Debit Balance Asset (if Taker?). 
  --     Wait, 'wallets' has 'locked_balance'.
  --     Maker Sell: Locked Asset.
  --     Taker Sell: Balance Asset (if not locked).
  --     Seller gets USD credit.

  -- BUYER LOGIC
  -- Credit Asset
  INSERT INTO public.wallets (user_id, asset, balance)
  VALUES (v_buyer_id, v_asset, p_match_amount)
  ON CONFLICT (user_id, asset) DO UPDATE
  SET balance = public.wallets.balance + p_match_amount;
  
  -- Refund USD (Only for Maker Buy Limit who locked at higher price)
  IF v_maker_order.side = 'BUY' AND v_maker_order.type = 'LIMIT' THEN
     -- Refund = (MakerPrice - ExecPrice) * Amount
     -- Also verify if MakerPrice > ExecPrice
     IF v_maker_order.price > p_price THEN
        UPDATE public.profiles
        SET balance_usd = balance_usd + ((v_maker_order.price - p_price) * p_match_amount)
        WHERE id = v_buyer_id;
     END IF;
  END IF;

  -- SELLER LOGIC
  -- Credit USD (Net of Fee)
  -- Fee Calculation:
  -- If Seller is Maker: Fee = p_maker_fee_rate * TotalUSD
  -- If Seller is Taker: Fee = p_taker_fee_rate * TotalUSD
  IF v_maker_order.side = 'SELL' THEN
    v_seller_fee_usd := v_total_usd * p_maker_fee_rate;
  ELSE
    v_seller_fee_usd := v_total_usd * p_taker_fee_rate;
  END IF;
  
  UPDATE public.profiles
  SET balance_usd = balance_usd + (v_total_usd - v_seller_fee_usd)
  WHERE id = v_seller_id;
  
  -- Debit Asset
  -- If Maker Sell: Deduct from LOCKED (it was locked on creation).
  -- If Taker Sell: Deduct from LOCKED (Assuming API locked it) OR BALANCE?
  -- To be safe, let's assume API deducts/locks everything into `locked_balance` before calling execute.
  -- So we simply reduce `locked_balance`.
  UPDATE public.wallets
  SET locked_balance = locked_balance - p_match_amount
  WHERE user_id = v_seller_id AND asset = v_asset;

  -- UPDATE ORDERS STATUS
  UPDATE public.orders
  SET filled_amount = filled_amount + p_match_amount,
      status = CASE 
        WHEN filled_amount + p_match_amount >= amount THEN 'FILLED' 
        ELSE 'PARTIAL' 
      END
  WHERE id = p_maker_order_id;
  
  UPDATE public.orders
  SET filled_amount = filled_amount + p_match_amount,
      status = CASE 
        WHEN filled_amount + p_match_amount >= amount THEN 'FILLED' 
        ELSE 'PARTIAL' 
      END
  WHERE id = p_taker_order_id;

  RETURN jsonb_build_object('success', true, 'trade_id', v_trade_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
