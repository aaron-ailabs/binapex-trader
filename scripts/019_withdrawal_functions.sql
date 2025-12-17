-- Create functions for approving and rejecting withdrawals

-- Function to approve withdrawal
CREATE OR REPLACE FUNCTION approve_withdrawal(
  withdrawal_id uuid,
  admin_id uuid
) RETURNS void AS $$
BEGIN
  -- Update withdrawal status to approved
  UPDATE withdrawals
  SET 
    status = 'approved',
    approved_by = admin_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = withdrawal_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject withdrawal and refund balance
CREATE OR REPLACE FUNCTION reject_withdrawal(
  withdrawal_id uuid,
  admin_id uuid,
  rejection_reason text DEFAULT 'Rejected by admin'
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_amount decimal(20, 8);
BEGIN
  -- Get withdrawal details
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM withdrawals
  WHERE id = withdrawal_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;

  -- Update withdrawal status to rejected
  UPDATE withdrawals
  SET 
    status = 'rejected',
    approved_by = admin_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = withdrawal_id;

  -- Refund the amount to user's balance
  UPDATE profiles
  SET 
    balance = balance + v_amount,
    updated_at = now()
  WHERE id = v_user_id;

  -- Log the transaction
  INSERT INTO transactions (user_id, type, amount, status, description)
  VALUES (
    v_user_id,
    'credit',
    v_amount,
    'completed',
    'Withdrawal refund: ' || rejection_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION reject_withdrawal TO authenticated;
