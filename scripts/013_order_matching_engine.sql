-- ============================================
-- ORDER MATCHING ENGINE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION match_order(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order limit_orders%ROWTYPE;
  v_matching_order limit_orders%ROWTYPE;
  v_trade_amount DECIMAL(18, 8);
  v_trade_price DECIMAL(18, 8);
  v_buyer_id UUID;
  v_seller_id UUID;
  v_buy_order_id UUID;
  v_sell_order_id UUID;
  v_buyer_fee DECIMAL(18, 8);
  v_seller_fee DECIMAL(18, 8);
  v_result JSON;
BEGIN
  -- Get the order details
  SELECT * INTO v_order FROM limit_orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Only match open or partially filled orders
  IF v_order.status NOT IN ('open', 'partially_filled') THEN
    RETURN json_build_object('success', false, 'error', 'Order not in matchable state');
  END IF;
  
  -- Find matching orders
  -- For buy orders: find lowest sell price
  -- For sell orders: find highest buy price
  IF v_order.side = 'buy' THEN
    SELECT * INTO v_matching_order
    FROM limit_orders
    WHERE trading_pair_id = v_order.trading_pair_id
      AND side = 'sell'
      AND status IN ('open', 'partially_filled')
      AND (v_order.order_type = 'market' OR price <= v_order.price)
      AND remaining_amount > 0
    ORDER BY price ASC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  ELSE
    SELECT * INTO v_matching_order
    FROM limit_orders
    WHERE trading_pair_id = v_order.trading_pair_id
      AND side = 'buy'
      AND status IN ('open', 'partially_filled')
      AND (v_order.order_type = 'market' OR price >= v_order.price)
      AND remaining_amount > 0
    ORDER BY price DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;
  
  IF NOT FOUND THEN
    -- No matching order, keep in order book
    RETURN json_build_object('success', true, 'matched', false, 'order_id', p_order_id);
  END IF;
  
  -- Calculate trade amount (minimum of both remaining amounts)
  v_trade_amount := LEAST(v_order.remaining_amount, v_matching_order.remaining_amount);
  
  -- Trade price is the maker's price (existing order in book)
  v_trade_price := v_matching_order.price;
  
  -- Determine buyer/seller
  IF v_order.side = 'buy' THEN
    v_buyer_id := v_order.user_id;
    v_seller_id := v_matching_order.user_id;
    v_buy_order_id := v_order.id;
    v_sell_order_id := v_matching_order.id;
    v_buyer_fee := v_trade_amount * v_trade_price * v_order.fee_percentage;
    v_seller_fee := v_trade_amount * v_trade_price * v_matching_order.fee_percentage;
  ELSE
    v_buyer_id := v_matching_order.user_id;
    v_seller_id := v_order.user_id;
    v_buy_order_id := v_matching_order.id;
    v_sell_order_id := v_order.id;
    v_buyer_fee := v_trade_amount * v_trade_price * v_matching_order.fee_percentage;
    v_seller_fee := v_trade_amount * v_trade_price * v_order.fee_percentage;
  END IF;
  
  -- Create trade record
  INSERT INTO executed_trades (
    buy_order_id, sell_order_id,
    buyer_id, seller_id,
    trading_pair_id,
    price, amount,
    buyer_fee, seller_fee
  ) VALUES (
    v_buy_order_id, v_sell_order_id,
    v_buyer_id, v_seller_id,
    v_order.trading_pair_id,
    v_trade_price, v_trade_amount,
    v_buyer_fee, v_seller_fee
  );
  
  -- Update order filled amounts and fees
  UPDATE limit_orders SET
    filled_amount = filled_amount + v_trade_amount,
    total_fee = total_fee + CASE WHEN id = v_buy_order_id THEN v_buyer_fee ELSE v_seller_fee END,
    status = CASE 
      WHEN filled_amount + v_trade_amount >= amount THEN 'filled'
      ELSE 'partially_filled'
    END,
    filled_at = CASE WHEN filled_amount + v_trade_amount >= amount THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id IN (v_order.id, v_matching_order.id);
  
  RETURN json_build_object(
    'success', true,
    'matched', true,
    'trade_amount', v_trade_amount,
    'trade_price', v_trade_price
  );
END;
$$;

-- ============================================
-- TRIGGER TO AUTO-MATCH MARKET ORDERS
-- ============================================

CREATE OR REPLACE FUNCTION trigger_match_market_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_type = 'market' AND NEW.status = 'open' THEN
    PERFORM match_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_order_insert_match ON limit_orders;
CREATE TRIGGER after_order_insert_match
AFTER INSERT ON limit_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_match_market_order();
