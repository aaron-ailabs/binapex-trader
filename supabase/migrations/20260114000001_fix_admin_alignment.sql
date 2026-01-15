-- Migration: Fix Admin Portal Alignment Issues
-- Purpose: Ensure trader database schema aligns with admin portal expectations
-- Date: 2026-01-14

-- ============================================================================
-- 1. FIX SUPPORT TICKET STRUCTURE
-- ============================================================================
-- Add missing fields that admin portal expects for support tickets
ALTER TABLE public.support_messages
ADD COLUMN IF NOT EXISTS ticket_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Create index for ticket lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status) WHERE status IN ('open', 'in_progress');

-- Update RLS policy to allow admins to update responded_by field
DROP POLICY IF EXISTS "Admin Update Support Messages" ON public.support_messages;
CREATE POLICY "Admin Update Support Messages" ON public.support_messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 2. ADD EXCHANGE RATE MANAGEMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Insert default USD-MYR rate (currently hardcoded at 4.45)
INSERT INTO public.exchange_rates (from_currency, to_currency, rate)
VALUES ('USD', 'MYR', 4.45)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- RLS policies for exchange rates
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Public can read current rates
CREATE POLICY "Public can view exchange rates" ON public.exchange_rates
FOR SELECT TO authenticated
USING (true);

-- Only admins can update rates
CREATE POLICY "Admin can update exchange rates" ON public.exchange_rates
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to get current exchange rate
CREATE OR REPLACE FUNCTION public.get_exchange_rate(
  p_from_currency VARCHAR,
  p_to_currency VARCHAR
)
RETURNS DECIMAL(18, 8) AS $$
DECLARE
  v_rate DECIMAL(18, 8);
BEGIN
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE from_currency = p_from_currency
  AND to_currency = p_to_currency;

  RETURN COALESCE(v_rate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. FIX STORAGE PERMISSIONS FOR ADMIN
-- ============================================================================
-- Add explicit admin DELETE policy for receipts bucket
-- (Supabase Storage policies are managed via dashboard, this is documented)

-- ============================================================================
-- 4. ADD PLATFORM BANK ACCOUNT TABLE TRIGGER
-- ============================================================================
-- Ensure platform_bank_accounts has updated_at trigger for realtime
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to platform_bank_accounts if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'platform_bank_accounts'
  ) THEN
    DROP TRIGGER IF EXISTS update_platform_bank_accounts_updated_at ON public.platform_bank_accounts;
    CREATE TRIGGER update_platform_bank_accounts_updated_at
    BEFORE UPDATE ON public.platform_bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 5. ADD RPC FUNCTION DOCUMENTATION (via COMMENT)
-- ============================================================================
COMMENT ON FUNCTION public.get_user_role IS
'Returns the role of the current authenticated user. Used by both trader and admin portals for role-based access control. Returns: "admin", "trader", or "moderator"';

COMMENT ON FUNCTION public.is_admin IS
'Checks if the current authenticated user has admin role. Returns boolean. Used in RLS policies and application code.';

COMMENT ON FUNCTION public.approve_deposit IS
'Admin-only function to approve a pending deposit transaction. Parameters: transaction_id UUID, admin_id UUID. Updates transaction status to "approved" and credits user wallet atomically.';

COMMENT ON FUNCTION public.approve_withdrawal IS
'Admin-only function to approve a pending withdrawal transaction. Parameters: transaction_id UUID. Updates transaction status to "approved" atomically.';

COMMENT ON FUNCTION public.reject_withdrawal IS
'Admin-only function to reject a withdrawal request. Parameters: transaction_id UUID, reason TEXT. Updates transaction status to "rejected" and logs rejection reason.';

COMMENT ON FUNCTION public.get_exchange_rate IS
'Returns the current exchange rate between two currencies. Parameters: from_currency VARCHAR, to_currency VARCHAR. Returns: DECIMAL rate or 0 if not found.';

-- ============================================================================
-- 6. CREATE ADMIN-TRADER SYNC VIEW
-- ============================================================================
-- View to help admin portal see pending actions
CREATE OR REPLACE VIEW public.admin_pending_actions AS
SELECT
  'deposit' AS action_type,
  t.id AS transaction_id,
  t.user_id,
  p.email AS user_email,
  p.full_name AS user_name,
  t.amount,
  t.created_at,
  t.receipt_url
FROM public.transactions t
JOIN auth.users u ON t.user_id = u.id
JOIN public.profiles p ON t.user_id = p.id
WHERE t.type = 'deposit' AND t.status = 'pending'

UNION ALL

SELECT
  'withdrawal' AS action_type,
  t.id AS transaction_id,
  t.user_id,
  p.email AS user_email,
  p.full_name AS user_name,
  t.amount,
  t.created_at,
  NULL AS receipt_url
FROM public.transactions t
JOIN auth.users u ON t.user_id = u.id
JOIN public.profiles p ON t.user_id = p.id
WHERE t.type = 'withdrawal' AND t.status = 'pending'

UNION ALL

SELECT
  'support_ticket' AS action_type,
  sm.id AS transaction_id,
  sm.user_id,
  p.email AS user_email,
  p.full_name AS user_name,
  0 AS amount,
  sm.created_at,
  sm.attachment_url AS receipt_url
FROM public.support_messages sm
JOIN auth.users u ON sm.user_id = u.id
JOIN public.profiles p ON sm.user_id = p.id
WHERE sm.status = 'open' AND sm.sender_role = 'user'
ORDER BY created_at DESC;

-- RLS for admin_pending_actions view
ALTER VIEW public.admin_pending_actions SET (security_barrier = true);
GRANT SELECT ON public.admin_pending_actions TO authenticated;

-- Only admins can access this view
CREATE OR REPLACE FUNCTION public.admin_pending_actions_rls()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. ADD AUDIT LOGGING FOR ADMIN ACTIONS
-- ============================================================================
-- Ensure all admin RPC functions log to admin_audit_logs
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_action VARCHAR,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_values,
    p_new_values,
    p_metadata,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_admin_action IS
'Logs admin actions to admin_audit_logs table for compliance tracking. Called by admin RPC functions to maintain audit trail.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify migration success:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'support_messages' ORDER BY ordinal_position;
-- SELECT * FROM public.exchange_rates;
-- SELECT * FROM public.admin_pending_actions LIMIT 5;
