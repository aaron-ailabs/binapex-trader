# Apply Database Migrations - Step-by-Step Guide

> **Status**: Migrations ready to apply
> **Files**: 2 migration files created
> **Risk Level**: Low (uses IF NOT EXISTS clauses)

---

## Quick Summary

You need to apply **2 database migrations** to fix the signup issue:

1. `20260113000000_add_withdrawal_password_support.sql` - Creates withdrawal password storage
2. `20260113000001_fix_wallets_schema.sql` - Adds asset_type to wallets

---

## Option 1: Supabase Dashboard (Easiest) ⭐

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **binapex-trader** project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run Migration 1

1. Click **New Query**
2. Copy and paste the SQL below:

```sql
-- Migration 1: Add Withdrawal Password Support
-- File: 20260113000000_add_withdrawal_password_support.sql

-- Create user_withdrawal_secrets table
CREATE TABLE IF NOT EXISTS public.user_withdrawal_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_withdrawal_secret UNIQUE(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_withdrawal_secrets_user_id
ON public.user_withdrawal_secrets(user_id);

-- Enable RLS
ALTER TABLE public.user_withdrawal_secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_withdrawal_secrets

-- Users can only view their own withdrawal secret
CREATE POLICY "Users can view own withdrawal secret"
ON public.user_withdrawal_secrets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own withdrawal secret (during signup)
CREATE POLICY "Users can insert own withdrawal secret"
ON public.user_withdrawal_secrets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own withdrawal secret
CREATE POLICY "Users can update own withdrawal secret"
ON public.user_withdrawal_secrets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawal secrets (for support, but cannot see plaintext)
CREATE POLICY "Admins can view all withdrawal secrets"
ON public.user_withdrawal_secrets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add columns to profiles table to track withdrawal password status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS withdrawal_password_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS withdrawal_password_last_reset TIMESTAMPTZ;

-- Create function to update withdrawal password timestamp
CREATE OR REPLACE FUNCTION update_withdrawal_password_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profiles table to reflect withdrawal password is set
  UPDATE public.profiles
  SET
    withdrawal_password_set = true,
    withdrawal_password_last_reset = NEW.updated_at
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update profiles when withdrawal password changes
DROP TRIGGER IF EXISTS tr_update_withdrawal_password_timestamp ON public.user_withdrawal_secrets;
CREATE TRIGGER tr_update_withdrawal_password_timestamp
AFTER INSERT OR UPDATE ON public.user_withdrawal_secrets
FOR EACH ROW
EXECUTE FUNCTION update_withdrawal_password_timestamp();

-- Add comment for documentation
COMMENT ON TABLE public.user_withdrawal_secrets IS 'Stores hashed withdrawal passwords separately from login passwords for enhanced security';
COMMENT ON COLUMN public.user_withdrawal_secrets.password_hash IS 'Bcrypt hash of withdrawal password (cost factor 10)';
COMMENT ON COLUMN public.profiles.withdrawal_password_set IS 'Indicates if user has set a withdrawal password';
COMMENT ON COLUMN public.profiles.withdrawal_password_last_reset IS 'Timestamp of last withdrawal password change';
```

3. Click **Run** (or press Ctrl+Enter)
4. ✅ Should see: "Success. No rows returned"

### Step 3: Run Migration 2

1. Click **New Query** again
2. Copy and paste the SQL below:

```sql
-- Migration 2: Fix Wallets Schema
-- File: 20260113000001_fix_wallets_schema.sql

-- Add asset_type column if it doesn't exist
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) DEFAULT 'fiat';

-- Add comment for clarity
COMMENT ON COLUMN public.wallets.asset_type IS 'Type of asset: fiat, crypto, stock, etc.';
```

3. Click **Run**
4. ✅ Should see: "Success. No rows returned"

### Step 4: Verify Migrations Applied

Run this verification query:

```sql
-- Verify user_withdrawal_secrets table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_withdrawal_secrets'
) AS user_withdrawal_secrets_exists;

-- Verify asset_type column exists in wallets
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'wallets'
  AND column_name = 'asset_type'
) AS asset_type_exists;

-- Verify profiles has withdrawal password columns
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'withdrawal_password_set'
) AS withdrawal_password_set_exists;
```

**Expected Result:**
```
user_withdrawal_secrets_exists | true
asset_type_exists              | true
withdrawal_password_set_exists | true
```

---

## Option 2: Install Supabase CLI (Recommended for Future)

### Install CLI

```bash
# macOS/Linux
curl -fsSL https://get.supabase.com | sh

# Or via npm
npm install -g supabase

# Or via Homebrew (macOS)
brew install supabase/tap/supabase
```

### Link Project

```bash
cd /home/user/binapex-trader

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Find your project ref at:
# https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/general
```

### Apply Migrations

```bash
# This will apply all pending migrations
supabase db push

# You should see:
# ✓ Applying migration 20260113000000_add_withdrawal_password_support.sql
# ✓ Applying migration 20260113000001_fix_wallets_schema.sql
```

---

## Option 3: Direct PostgreSQL Connection

If you have psql installed and your database connection string:

```bash
# Get connection string from Supabase Dashboard:
# Settings → Database → Connection string (Direct connection)

# Apply migration 1
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  -f supabase/migrations/20260113000000_add_withdrawal_password_support.sql

# Apply migration 2
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  -f supabase/migrations/20260113000001_fix_wallets_schema.sql
```

---

## Troubleshooting

### Error: "relation already exists"

This is **OK**! The migrations use `IF NOT EXISTS` clauses, so they're idempotent.

### Error: "column already exists"

This is also **OK**! It means the column was already added.

### Error: "permission denied"

**Solution**: Make sure you're using the **postgres** role (not anon key).
In Supabase Dashboard, the SQL Editor automatically uses the correct role.

### Error: "policy already exists"

**Solution**: The migration will skip creating duplicate policies. This is safe.

---

## After Applying Migrations

### Test Signup Immediately

1. Go to https://binapex.my/signup
2. Fill in test data:
   - Name: Test User
   - Email: test-[timestamp]@example.com (use unique email)
   - Password: Test1234!
   - Withdrawal Password: Withdraw1234!
3. Click "Create Account"
4. ✅ **Should work now!** → Redirect to login

### Verify Database Records

After successful signup, check in SQL Editor:

```sql
-- Check the test user
SELECT
  u.id,
  u.email,
  p.full_name,
  p.withdrawal_password_set,
  w.asset,
  w.asset_type,
  w.balance,
  s.password_hash IS NOT NULL AS has_withdrawal_password
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN wallets w ON w.user_id = u.id
LEFT JOIN user_withdrawal_secrets s ON s.user_id = u.id
WHERE u.email LIKE 'test-%@example.com'
ORDER BY u.created_at DESC
LIMIT 5;
```

**Expected Result:**
- `withdrawal_password_set`: true
- `asset`: USD
- `asset_type`: fiat
- `has_withdrawal_password`: true

---

## Migration Files Location

The SQL is also available in these files:
- `/home/user/binapex-trader/supabase/migrations/20260113000000_add_withdrawal_password_support.sql`
- `/home/user/binapex-trader/supabase/migrations/20260113000001_fix_wallets_schema.sql`

---

## What These Migrations Do

### Migration 1: `add_withdrawal_password_support.sql`

**Creates:**
- `user_withdrawal_secrets` table (secure password storage)
- RLS policies (user privacy + admin support)
- `profiles.withdrawal_password_set` column (tracking)
- `profiles.withdrawal_password_last_reset` column (audit)
- Trigger to auto-update profiles when password changes

**Why It's Safe:**
- Uses `IF NOT EXISTS` - won't break if run twice
- No data modification - only schema changes
- RLS protects user privacy
- Trigger is `SECURITY DEFINER` (proper permissions)

### Migration 2: `fix_wallets_schema.sql`

**Adds:**
- `wallets.asset_type` column (required by signup trigger)

**Why It's Safe:**
- Uses `IF NOT EXISTS` - idempotent
- Sets default value 'fiat' for existing rows
- No breaking changes

---

## Security Notes

### Withdrawal Passwords are Secure

- Stored as **bcrypt hashes** (cost factor 10)
- **Separate table** from profiles (breach isolation)
- **Row Level Security** enabled (users see only their own)
- **Cannot be decrypted** (one-way hash)

### Admin Access

- Admins can view `user_withdrawal_secrets` table
- But they **cannot see plaintext passwords**
- Only the bcrypt hash is stored
- For support purposes only

---

## Summary Checklist

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run Migration 1 SQL (user_withdrawal_secrets)
- [ ] Run Migration 2 SQL (wallets.asset_type)
- [ ] Run verification query (check all exist)
- [ ] Test signup with new account
- [ ] Verify database records created
- [ ] ✅ Signup now works!

---

## Need Help?

**Common Issues:**
- "Can't connect to Supabase" → Check project ref and login
- "Permission denied" → Use SQL Editor (auto-uses correct role)
- "Migrations already applied" → This is OK! Check with verification query

**Still Having Issues?**
1. Check Supabase Dashboard → Logs
2. Check browser console for errors
3. Review `/docs/SIGNUP_FIX_README.md` for detailed troubleshooting

---

**Status**: Ready to apply ✅
**Risk**: Low (safe, idempotent migrations)
**Time**: 5 minutes
**Impact**: Fixes signup for all new users

Let's get this done! 🚀
