-- Function to credit user balance (for deposit approval)
CREATE OR REPLACE FUNCTION credit_user_balance(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to debit user balance (for withdrawal processing)
CREATE OR REPLACE FUNCTION debit_user_balance(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET balance = COALESCE(balance, 0) - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  AND COALESCE(balance, 0) >= p_amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
