-- Fix handle_new_user function to match current schema
-- 1. Correct wallets column name (asset_symbol -> asset)
-- 2. Provide required asset_type for wallets
-- 3. Ensure credit_score is provided for profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- insert into profiles
  -- Added credit_score: 100 default
  INSERT INTO public.profiles (id, full_name, email, role, balance_usd, credit_score)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user', 0, 100);

  -- insert into wallets (USD default)
  -- Corrected asset_symbol -> asset
  -- Added asset_type: 'fiat'
  INSERT INTO public.wallets (user_id, asset, asset_type, balance, locked_balance)
  VALUES (new.id, 'USD', 'fiat', 0, 0);

  RETURN new;
END;
$function$;
