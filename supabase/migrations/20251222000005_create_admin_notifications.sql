-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can see notifications
CREATE POLICY admin_notifications_admin_policy ON admin_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to handle transaction notifications
CREATE OR REPLACE FUNCTION notify_admin_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify on NEW Deposit (usually 'pending' when receipt is uploaded)
  IF (TG_OP = 'INSERT') AND (NEW.type = 'deposit') THEN
    INSERT INTO admin_notifications (user_id, type, message)
    VALUES (NEW.user_id, 'deposit', 'A user has uploaded a deposit receipt of $' || NEW.amount);
  END IF;

  -- Notify on NEW Withdrawal Request
  IF (TG_OP = 'INSERT') AND (NEW.type = 'withdrawal') THEN
    INSERT INTO admin_notifications (user_id, type, message)
    VALUES (NEW.user_id, 'withdrawal', 'A new withdrawal request of $' || NEW.amount || ' has been submitted.');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle trade notifications (Order Book matches)
CREATE OR REPLACE FUNCTION notify_admin_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  v_pair_symbol TEXT;
BEGIN
  SELECT symbol INTO v_pair_symbol FROM trading_pairs WHERE id = NEW.trading_pair_id;

  INSERT INTO admin_notifications (user_id, type, message)
  VALUES (NEW.buyer_id, 'trade', 'Trade executed (Order Book): ' || NEW.amount || ' ' || COALESCE(v_pair_symbol, 'Asset') || ' at ' || NEW.price);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle trades from the 'trades' table (Binary/Direct trades)
CREATE OR REPLACE FUNCTION notify_admin_on_direct_trade()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (user_id, type, message)
  VALUES (NEW.user_id, 'trade', 'New Trade: ' || NEW.type || ' on ' || COALESCE(NEW.asset_symbol, 'Asset') || ' - Amount: ' || NEW.amount);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on transactions table
DROP TRIGGER IF EXISTS tr_notify_admin_on_transaction ON transactions;
CREATE TRIGGER tr_notify_admin_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_transaction();

-- Trigger on executed_trades table
DROP TRIGGER IF EXISTS tr_notify_admin_on_trade ON executed_trades;
CREATE TRIGGER tr_notify_admin_on_trade
AFTER INSERT ON executed_trades
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_trade();

-- Trigger on trades table
DROP TRIGGER IF EXISTS tr_notify_admin_on_direct_trade ON trades;
CREATE TRIGGER tr_notify_admin_on_direct_trade
AFTER INSERT ON trades
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_direct_trade();
