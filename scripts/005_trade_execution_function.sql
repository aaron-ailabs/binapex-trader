-- Database function to execute trade in atomic transaction
CREATE OR REPLACE FUNCTION execute_trade_transaction(
  p_user_id UUID,
  p_asset_id UUID,
  p_order_type TEXT,
  p_entry_price DECIMAL,
  p_executed_price DECIMAL,
  p_size DECIMAL,
  p_leverage INTEGER,
  p_margin_used DECIMAL,
  p_slippage_applied DECIMAL,
  p_risk_mode TEXT
) RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Deduct margin from user balance
  UPDATE public.profiles
  SET balance_usd = balance_usd - p_margin_used
  WHERE id = p_user_id
  RETURNING balance_usd INTO v_new_balance;

  -- Create order record
  INSERT INTO public.orders (
    user_id,
    asset_id,
    order_type,
    entry_price,
    executed_price,
    size,
    leverage,
    margin_used,
    status,
    slippage_applied,
    risk_mode
  ) VALUES (
    p_user_id,
    p_asset_id,
    p_order_type,
    p_entry_price,
    p_executed_price,
    p_size,
    p_leverage,
    p_margin_used,
    'filled',
    p_slippage_applied,
    p_risk_mode
  );

  -- Create open position
  INSERT INTO public.trades (
    user_id,
    asset_id,
    type,
    entry_price,
    size,
    leverage,
    margin_used,
    status,
    opened_at
  ) VALUES (
    p_user_id,
    p_asset_id,
    p_order_type,
    p_executed_price, -- Use executed price as entry
    p_size,
    p_leverage,
    p_margin_used,
    'open',
    NOW()
  );

  -- Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    payment_method
  ) VALUES (
    p_user_id,
    'trade_loss',
    -p_margin_used,
    'USD',
    'completed',
    'margin'
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION execute_trade_transaction TO service_role;
