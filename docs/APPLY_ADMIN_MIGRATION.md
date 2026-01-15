# How to Apply Admin Alignment Migration

**Migration File**: `supabase/migrations/20260114000001_fix_admin_alignment.sql`
**Purpose**: Align trader database schema with admin portal expectations
**Date**: 2026-01-14

---

## Prerequisites

- Access to Supabase dashboard
- Admin privileges on the Supabase project
- Backup of database (recommended)

---

## Method 1: Supabase Dashboard (Recommended)

This is the simplest and most reliable method.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Load Migration File**
   - Open `supabase/migrations/20260114000001_fix_admin_alignment.sql` in your code editor
   - Copy the entire contents (268 lines)
   - Paste into the SQL Editor

4. **Execute Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for execution to complete
   - Check for any errors in the output panel

5. **Verify Migration Success**
   Run these verification queries:

   ```sql
   -- Check support_messages columns
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'support_messages'
   ORDER BY ordinal_position;

   -- Should see: ticket_id, category, priority, status, attachment_url, responded_by, responded_at

   -- Check exchange_rates table
   SELECT * FROM public.exchange_rates;

   -- Should return: USD -> MYR = 4.45

   -- Check admin_pending_actions view
   SELECT * FROM public.admin_pending_actions LIMIT 5;

   -- Should return pending deposits, withdrawals, support tickets
   ```

---

## Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase migration up --version 20260114000001
```

---

## Method 3: Programmatic (Advanced)

If you need to apply via code:

```typescript
// Note: This requires a custom exec_sql RPC function in your database
// Or use Supabase Management API

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const migrationSQL = readFileSync('supabase/migrations/20260114000001_fix_admin_alignment.sql', 'utf-8')

// Execute via Management API
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: migrationSQL })
  }
)
```

---

## What This Migration Does

### 1. Fixes Support Ticket Structure
Adds missing columns to `support_messages` table:
- `ticket_id` - UUID for grouping related messages
- `category` - Type of support request
- `priority` - Urgency level (low/normal/high/urgent)
- `status` - Ticket status (open/in_progress/resolved/closed)
- `attachment_url` - File attachments
- `responded_by` - Admin who responded
- `responded_at` - Response timestamp

### 2. Creates Exchange Rate System
- New `exchange_rates` table to replace hardcoded rates
- `get_exchange_rate()` RPC function for queries
- Default USD → MYR rate of 4.45
- RLS policies for public read, admin write

### 3. Documents RPC Functions
Adds COMMENT statements to document:
- `get_user_role()` - Returns user's role
- `is_admin()` - Checks if user is admin
- `approve_deposit()` - Approves pending deposit
- `approve_withdrawal()` - Approves pending withdrawal
- `reject_withdrawal()` - Rejects withdrawal with reason
- `get_exchange_rate()` - Gets current exchange rate

### 4. Creates Admin Views
- `admin_pending_actions` - Combined view of pending deposits, withdrawals, and support tickets
- Filtered by RLS to admin-only access

### 5. Adds Audit Logging
- `log_admin_action()` - Helper function for audit trail
- Logs to `admin_audit_logs` table with old/new values

### 6. Improves Realtime Support
- Adds `updated_at` trigger to `platform_bank_accounts`
- Enables realtime subscriptions for bank account changes

---

## Rollback Plan

If you need to rollback this migration:

```sql
-- 1. Drop new views
DROP VIEW IF EXISTS public.admin_pending_actions;

-- 2. Drop new functions
DROP FUNCTION IF EXISTS public.log_admin_action;
DROP FUNCTION IF EXISTS public.admin_pending_actions_rls;
DROP FUNCTION IF EXISTS public.get_exchange_rate;

-- 3. Drop new table
DROP TABLE IF EXISTS public.exchange_rates;

-- 4. Remove added columns
ALTER TABLE public.support_messages
  DROP COLUMN IF EXISTS ticket_id,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS attachment_url,
  DROP COLUMN IF EXISTS responded_by,
  DROP COLUMN IF EXISTS responded_at;

-- 5. Drop indexes
DROP INDEX IF EXISTS idx_support_messages_ticket_id;
DROP INDEX IF EXISTS idx_support_messages_status;
```

---

## Testing After Migration

### Test 1: Support Ticket Structure
```sql
-- Insert test support message
INSERT INTO public.support_messages (
  user_id,
  sender_role,
  content,
  category,
  priority,
  status
) VALUES (
  auth.uid(),
  'user',
  'Test message',
  'technical',
  'normal',
  'open'
);

-- Verify columns exist
SELECT ticket_id, category, priority, status, created_at
FROM public.support_messages
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
```

### Test 2: Exchange Rates
```sql
-- Query default rate
SELECT public.get_exchange_rate('USD', 'MYR');
-- Should return: 4.45

-- Update rate (as admin)
UPDATE public.exchange_rates
SET rate = 4.50, updated_at = NOW()
WHERE from_currency = 'USD' AND to_currency = 'MYR';

-- Verify update
SELECT * FROM public.exchange_rates;
```

### Test 3: Admin Pending Actions
```sql
-- View pending actions (as admin)
SELECT * FROM public.admin_pending_actions;

-- Should show all pending deposits, withdrawals, support tickets
```

### Test 4: API Endpoint
```bash
# Test exchange rate API
curl https://www.binapex.my/api/exchange-rates?from=USD&to=MYR

# Expected response:
# {
#   "success": true,
#   "data": {
#     "from": "USD",
#     "to": "MYR",
#     "rate": 4.45,
#     "updated_at": "2026-01-14T..."
#   }
# }
```

---

## Troubleshooting

### Error: Column already exists
This means the migration was partially applied. Check which columns exist:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'support_messages';
```

Then manually apply only the missing parts.

### Error: Function already exists
Drop the existing function first:
```sql
DROP FUNCTION IF EXISTS public.get_exchange_rate;
```

Then re-run the CREATE FUNCTION statement.

### Error: RLS policy already exists
Drop the existing policy first:
```sql
DROP POLICY IF EXISTS "Admin Update Support Messages" ON public.support_messages;
```

Then re-run the CREATE POLICY statement.

---

## Post-Migration Checklist

After applying the migration:

- [ ] Verify all support_messages columns exist
- [ ] Verify exchange_rates table exists with default USD-MYR rate
- [ ] Verify admin_pending_actions view returns data
- [ ] Test exchange rate API endpoint
- [ ] Test support ticket creation with new fields
- [ ] Verify admin can update support ticket status
- [ ] Verify admin can update exchange rates
- [ ] Test realtime subscriptions on platform_bank_accounts
- [ ] Check admin portal can access all new features

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs
2. Review error messages in SQL Editor output
3. Verify RLS policies are not blocking queries
4. Ensure user has admin role: `SELECT role FROM profiles WHERE id = auth.uid()`
5. Contact support with error details

---

**Migration Status**: Ready to apply
**Estimated Time**: 2-5 minutes
**Risk Level**: Low (additive changes only, no data loss)
