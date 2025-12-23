-- Enhance admin notifications with user details (Name and Email)

-- Function to handle transaction notifications (Deposit/Withdrawal)
CREATE OR REPLACE FUNCTION notify_admin_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Fetch user details
  SELECT full_name, email INTO v_user_name, v_user_email FROM profiles WHERE id = NEW.user_id;
  
  -- Fallback if not found
  IF v_user_name IS NULL THEN v_user_name := 'Unknown User'; END IF;
  IF v_user_email IS NULL THEN v_user_email := 'No Email'; END IF;

  -- Notify on NEW Deposit
  IF (TG_OP = 'INSERT') AND (NEW.type = 'deposit') THEN
    INSERT INTO admin_notifications (user_id, type, message)
    VALUES (NEW.user_id, 'deposit', concat('D E P O S I T: ', v_user_name, ' (', v_user_email, ') has uploaded a deposit receipt of $', NEW.amount));
  END IF;

  -- Notify on NEW Withdrawal Request
  IF (TG_OP = 'INSERT') AND (NEW.type = 'withdrawal') THEN
    INSERT INTO admin_notifications (user_id, type, message)
    VALUES (NEW.user_id, 'withdrawal', concat('W I T H D R A W A L: ', v_user_name, ' (', v_user_email, ') requested withdrawal of $', NEW.amount));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle trade notifications (Order Book matches)
CREATE OR REPLACE FUNCTION notify_admin_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  v_pair_symbol TEXT;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  SELECT symbol INTO v_pair_symbol FROM trading_pairs WHERE id = NEW.trading_pair_id;
  SELECT full_name, email INTO v_user_name, v_user_email FROM profiles WHERE id = NEW.buyer_id;

   -- Fallback if not found
  IF v_user_name IS NULL THEN v_user_name := 'Unknown User'; END IF;
  IF v_user_email IS NULL THEN v_user_email := 'No Email'; END IF;

  INSERT INTO admin_notifications (user_id, type, message)
  VALUES (NEW.buyer_id, 'trade', concat('T R A D E (Order Book): ', v_user_name, ' (', v_user_email, ') executed ', NEW.amount, ' ', COALESCE(v_pair_symbol, 'Asset'), ' at ', NEW.price));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle trades from the 'trades' table (Binary/Direct trades)
CREATE OR REPLACE FUNCTION notify_admin_on_direct_trade()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  SELECT full_name, email INTO v_user_name, v_user_email FROM profiles WHERE id = NEW.user_id;

   -- Fallback if not found
  IF v_user_name IS NULL THEN v_user_name := 'Unknown User'; END IF;
  IF v_user_email IS NULL THEN v_user_email := 'No Email'; END IF;

  INSERT INTO admin_notifications (user_id, type, message)
  VALUES (NEW.user_id, 'trade', concat('T R A D E: ', v_user_name, ' (', v_user_email, ') opened ', NEW.type, ' on ', COALESCE(NEW.asset_symbol, 'Asset'), ' - Amount: ', NEW.amount));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
