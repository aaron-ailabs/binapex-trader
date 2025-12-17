-- Security Audit Script for Production
-- Run this to verify all security measures are in place

-- 1. Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Expected: 0 rows (all tables should have RLS enabled)

-- 2. Verify anon role cannot access sensitive data
SET ROLE anon;
SELECT count(*) FROM profiles; -- Should fail with permission denied
SELECT count(*) FROM trades; -- Should fail with permission denied
SELECT count(*) FROM transactions; -- Should fail with permission denied
RESET ROLE;

-- 3. List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Ensure all financial columns use numeric type (not float)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('amount', 'price', 'balance', 'fee', 'margin', 'pnl')
  AND data_type != 'numeric';
-- Expected: 0 rows (all financial columns should be numeric)

-- 5. Check for missing indexes on foreign keys
SELECT
  c.conrelid::regclass AS table_name,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND a.attnum = ANY(i.indkey)
  );
-- Expected: 0 rows (all foreign keys should have indexes)

-- 6. Verify storage buckets have proper policies
-- Run in Supabase Dashboard Storage Settings

-- 7. Enable RLS on any tables that don't have it
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
  END LOOP;
END $$;

-- 8. Create rate limiting table for auth attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address inet NOT NULL,
  attempt_type text NOT NULL, -- 'login', 'signup', 'password_reset'
  attempted_at timestamptz DEFAULT now(),
  user_agent text
);

ALTER TABLE public.auth_rate_limit ENABLE ROW LEVEL SECURITY;

-- Clean up old rate limit records (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_attempted_at ON auth_rate_limit(attempted_at);

-- 9. Add check constraints for financial validations
ALTER TABLE transactions
  ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

ALTER TABLE trades
  ADD CONSTRAINT check_valid_leverage CHECK (leverage >= 1 AND leverage <= 100),
  ADD CONSTRAINT check_positive_entry_price CHECK (entry_price > 0),
  ADD CONSTRAINT check_positive_position_size CHECK (position_size > 0);

-- 10. Summary report
SELECT 
  'Tables with RLS' as check_type,
  count(*) as count
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'RLS Policies',
  count(*)
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Indexes',
  count(*)
FROM pg_indexes
WHERE schemaname = 'public';
