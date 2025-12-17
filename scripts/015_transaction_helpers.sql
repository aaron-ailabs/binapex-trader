-- Create helper functions for atomic transactions

-- Function to execute multiple operations atomically
CREATE OR REPLACE FUNCTION execute_transaction(operations text[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  operation text;
BEGIN
  -- Execute each operation
  FOREACH operation IN ARRAY operations
  LOOP
    EXECUTE operation;
  END LOOP;
  
  -- Return success
  result := json_build_object('success', true);
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback on error
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;

-- Function to update wallet balance atomically
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id uuid,
  p_asset_symbol text,
  p_amount numeric,
  p_is_locked boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id uuid;
  v_current_balance numeric;
  v_result json;
BEGIN
  -- Get wallet and lock row
  SELECT id, CASE WHEN p_is_locked THEN locked_balance ELSE available_balance END
  INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND asset_symbol = p_asset_symbol
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user % and asset %', p_user_id, p_asset_symbol;
  END IF;

  -- Check sufficient balance for deductions
  IF p_amount < 0 AND v_current_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update balance
  IF p_is_locked THEN
    UPDATE public.wallets
    SET locked_balance = locked_balance + p_amount,
        total_balance = total_balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;
  ELSE
    UPDATE public.wallets
    SET available_balance = available_balance + p_amount,
        total_balance = total_balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;
  END IF;

  -- Return result
  SELECT json_build_object(
    'success', true,
    'wallet_id', id,
    'available_balance', available_balance,
    'locked_balance', locked_balance,
    'total_balance', total_balance
  ) INTO v_result
  FROM public.wallets
  WHERE id = v_wallet_id;

  RETURN v_result;
END;
$$;
