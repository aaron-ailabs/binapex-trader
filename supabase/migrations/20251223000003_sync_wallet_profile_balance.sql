-- Sync Wallet Balance to Profile Trigger and One-time Update

-- 1. Create Trigger Function
CREATE OR REPLACE FUNCTION public.sync_wallet_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the asset is USD
    IF NEW.asset = 'USD' THEN
        UPDATE public.profiles
        SET balance_usd = NEW.balance
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS on_wallet_usd_change ON public.wallets;
CREATE TRIGGER on_wallet_usd_change
AFTER INSERT OR UPDATE OF balance ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.sync_wallet_to_profile();

-- 3. One-time Sync for Verified Inconsistency
-- Update profiles.balance_usd to match wallets.balance where asset is USD
UPDATE public.profiles p
SET balance_usd = w.balance
FROM public.wallets w
WHERE p.id = w.user_id AND w.asset = 'USD';
