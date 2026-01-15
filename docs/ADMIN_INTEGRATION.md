# Admin Portal Integration Guide

**Last Updated:** 2026-01-14
**Trader Version:** 0.1.0
**Admin Portal URL:** https://admin.binapex.my

---

## Overview

The Binapex platform operates as a **database-coupled microservice architecture** with two separate Next.js applications sharing a single Supabase database:

- **Binapex Trader** (this repository): User-facing trading platform
- **Binapex Admin** (separate repository): Administrative management portal

Integration is achieved through **shared database schema, RPC functions, and realtime subscriptions** rather than REST API calls between services.

---

## Architecture Diagram

```
┌─────────────────────┐         ┌──────────────────────┐
│  Binapex Trader     │         │   Binapex Admin      │
│  (User Portal)      │         │   (Admin Portal)     │
│                     │         │                      │
│  - Trading UI       │         │  - User Management   │
│  - Deposits         │         │  - Transaction       │
│  - Withdrawals      │         │    Approval          │
│  - Support Chat     │         │  - Support Tickets   │
│  - Portfolio        │         │  - System Config     │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           │    ┌─────────────────────┐   │
           └────┤  Supabase Database  ├───┘
                │  (Shared)           │
                │                     │
                │  - RLS Policies     │
                │  - RPC Functions    │
                │  - Realtime         │
                │  - Auth             │
                │  - Storage          │
                └─────────────────────┘
```

---

## Integration Points

### 1. Database Schema

Both applications share the same Supabase project with the following key tables:

| Table | Trader Access | Admin Access | Purpose |
|-------|---------------|--------------|---------|
| `profiles` | Own record | All records | User profile data with role |
| `transactions` | Own records | All records | Deposits/withdrawals |
| `support_messages` | Own messages | All messages | Support chat |
| `admin_notifications` | None | All records | Admin alerts |
| `limit_orders` | Own orders | All orders | Trading orders |
| `trades` | Own trades | All trades | Trade positions |
| `wallets` | Own wallet | All wallets | User balances |
| `platform_bank_accounts` | Read only | Full access | Payment options |
| `exchange_rates` | Read only | Full access | Currency rates |
| `admin_audit_logs` | None | All records | Audit trail |

### 2. Row Level Security (RLS)

All tables have RLS enabled with policies following this pattern:

```sql
-- Users can access their own data
CREATE POLICY "Users can view own records" ON table_name
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can access all data
CREATE POLICY "Admins can view all records" ON table_name
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 3. RPC Functions

The following RPC functions provide the integration API:

#### User & Role Management

```sql
-- Get user's role
get_user_role(user_id: UUID) RETURNS VARCHAR

-- Check if user is admin
is_admin(user_id: UUID) RETURNS BOOLEAN
```

#### Transaction Approval

```sql
-- Approve deposit (atomic operation)
approve_deposit(
  transaction_id: UUID,
  admin_id: UUID
) RETURNS VOID

-- Approve withdrawal (atomic operation)
approve_withdrawal(
  transaction_id: UUID
) RETURNS VOID

-- Reject withdrawal with reason
reject_withdrawal(
  transaction_id: UUID,
  reason: TEXT
) RETURNS VOID
```

#### Exchange Rates

```sql
-- Get current exchange rate
get_exchange_rate(
  p_from_currency: VARCHAR,
  p_to_currency: VARCHAR
) RETURNS DECIMAL(18,8)
```

#### Audit Logging

```sql
-- Log admin actions
log_admin_action(
  p_entity_type: VARCHAR,
  p_entity_id: UUID,
  p_action: VARCHAR,
  p_old_values: JSONB,
  p_new_values: JSONB,
  p_metadata: JSONB
) RETURNS VOID
```

### 4. Realtime Subscriptions

Both applications can subscribe to database changes in realtime:

#### Trader Subscriptions

- `support_messages`: Live chat updates
- `transactions`: Status changes (approved/rejected)
- `platform_bank_accounts`: New payment options
- `admin_notifications`: Not subscribed (admin-only table)

#### Admin Subscriptions

- `support_messages`: New user messages
- `transactions`: New deposits/withdrawals
- `trades`: New trade executions
- `admin_notifications`: System alerts

Example subscription code:

```typescript
const supabase = createClient()

const channel = supabase
  .channel('support-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'support_messages'
    },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()
```

### 5. Storage Buckets

Shared storage buckets:

- **`receipts`**: Deposit receipt images
  - Users: Upload only
  - Admin: Read all
- **`attachments`**: Support ticket attachments
  - Users: Upload own
  - Admin: Read all

### 6. Authentication

Both applications use the same Supabase Auth instance:

- Users authenticate once and can access both portals (if they have admin role)
- Admin users have `role = 'admin'` in the `profiles` table
- Trader application redirects `/admin/*` paths to `https://admin.binapex.my`

---

## Shared Type Definitions

The file `/lib/types/admin-shared.ts` contains all shared type definitions that should be referenced by both applications:

```typescript
import type {
  UserProfile,
  Transaction,
  SupportMessage,
  AdminNotification,
  ExchangeRate,
  PlatformBankAccount,
  ApiResponse
} from "@/lib/types/admin-shared"
```

**IMPORTANT:** Both applications should import from this file to ensure type consistency.

---

## API Endpoints

### Trader Endpoints (Used by Admin)

The trader application provides these public API endpoints:

#### `/api/exchange-rates`

Get current exchange rates.

**Query Parameters:**
- `from`: Source currency (e.g., "USD")
- `to`: Target currency (e.g., "MYR")

**Response:**
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "MYR",
    "rate": 4.45,
    "updated_at": "2026-01-14T10:30:00Z"
  }
}
```

### Admin-Only Endpoints

All admin-specific endpoints were **removed** from the trader application in commit `0d41bcd`. Admin portal should implement its own API routes and call shared RPC functions.

---

## Database Views

### `admin_support_inbox`

Quick view of latest support message per user:

```sql
CREATE VIEW admin_support_inbox AS
SELECT DISTINCT ON (user_id)
  user_id,
  content AS last_message,
  sender_role,
  created_at AS last_activity
FROM support_messages
ORDER BY user_id, created_at DESC;
```

### `admin_pending_actions`

Combined view of all pending admin actions:

```sql
CREATE VIEW admin_pending_actions AS
SELECT
  'deposit' AS action_type,
  t.id AS transaction_id,
  t.user_id,
  p.email AS user_email,
  t.amount,
  t.created_at
FROM transactions t
JOIN profiles p ON t.user_id = p.id
WHERE t.type = 'deposit' AND t.status = 'pending'

UNION ALL

SELECT
  'withdrawal' AS action_type,
  t.id,
  t.user_id,
  p.email,
  t.amount,
  t.created_at
FROM transactions t
JOIN profiles p ON t.user_id = p.id
WHERE t.type = 'withdrawal' AND t.status = 'pending'

UNION ALL

SELECT
  'support_ticket' AS action_type,
  sm.id,
  sm.user_id,
  p.email,
  0 AS amount,
  sm.created_at
FROM support_messages sm
JOIN profiles p ON sm.user_id = p.id
WHERE sm.status = 'open' AND sm.sender_role = 'user'
ORDER BY created_at DESC;
```

---

## Notification System

### Automatic Notifications

The database automatically creates admin notifications via triggers:

1. **New Deposit**: Triggered when `transactions.type = 'deposit'` is inserted
2. **New Withdrawal**: Triggered when `transactions.type = 'withdrawal'` is inserted
3. **New Trade**: Triggered when `trades` record is inserted
4. **New Support Message**: Triggered when `support_messages.sender_role = 'user'` is inserted

Notifications are inserted into `admin_notifications` table with RLS restricting access to admins only.

---

## Data Flow Examples

### Example 1: User Deposits Funds

```
1. User uploads receipt in Trader UI
   ↓
2. Trader calls submitDeposit() server action
   ↓
3. Record inserted into transactions table
   ↓
4. Database trigger fires → admin_notifications created
   ↓
5. Admin portal receives realtime notification
   ↓
6. Admin reviews and calls approve_deposit() RPC
   ↓
7. Transaction status updated to 'approved'
   ↓
8. User's wallet balance credited atomically
   ↓
9. Trader UI shows updated balance via realtime subscription
```

### Example 2: User Requests Withdrawal

```
1. User submits withdrawal request in Trader UI
   ↓
2. Trader calls submitWithdrawal() server action
   ↓
3. RPC request_new_withdrawal() validates password
   ↓
4. Transaction created with status 'pending'
   ↓
5. Admin notification created
   ↓
6. Admin portal receives realtime update
   ↓
7. Admin calls approve_withdrawal() or reject_withdrawal()
   ↓
8. Transaction status updated
   ↓
9. Trader UI shows status change via realtime subscription
```

### Example 3: Support Chat

```
1. User sends message in Trader support chat
   ↓
2. Message inserted into support_messages (sender_role='user')
   ↓
3. Admin portal receives realtime update
   ↓
4. Admin responds by inserting message (sender_role='admin')
   ↓
5. Trader UI receives realtime update
   ↓
6. User sees admin response immediately
```

---

## Migration History

### Removed Admin Features (Jan 11-14, 2026)

| Commit | Changes |
|--------|---------|
| `0d41bcd` | Deleted 60 files, 6,293 lines - All admin components and routes |
| `c79fe0f` | Added middleware redirect `/admin/*` → `https://admin.binapex.my` |
| `b3c9f1e` | Removed final admin stats endpoint |

### Admin Alignment Fixes (Jan 14, 2026)

| Commit | Changes |
|--------|---------|
| `20260114000001` | Fixed support ticket structure, added exchange rate table, documented RPC functions |

---

## Testing Integration

### Test Scenarios

1. **Transaction Approval Flow**
   ```bash
   # From trader: Create deposit
   # From admin: Approve deposit
   # Verify: User balance updated
   # Verify: Notification cleared
   ```

2. **Support Chat Realtime**
   ```bash
   # From trader: Send support message
   # From admin: Verify realtime update
   # From admin: Send response
   # From trader: Verify realtime update
   ```

3. **Exchange Rate Update**
   ```bash
   # From admin: Update USD/MYR rate
   # From trader: Call /api/exchange-rates
   # Verify: New rate returned
   ```

4. **Platform Bank Changes**
   ```bash
   # From admin: Add new bank account
   # From trader: Verify realtime update in deposit page
   # Verify: New bank appears in dropdown
   ```

---

## Common Issues & Troubleshooting

### Issue 1: RLS Policy Blocking Query

**Symptom**: Admin queries return empty results

**Solution**: Verify user has `role = 'admin'` in profiles table

```sql
SELECT id, email, role FROM auth.users
JOIN profiles ON users.id = profiles.id
WHERE email = 'admin@example.com';
```

### Issue 2: Realtime Not Working

**Symptom**: Changes not appearing in real-time

**Solution**:
1. Check Supabase Realtime is enabled for table
2. Verify RLS policies allow user to view records
3. Check subscription channel is properly set up

```typescript
// Check subscription status
channel.subscribe((status) => {
  console.log('Status:', status) // Should be 'SUBSCRIBED'
})
```

### Issue 3: Type Mismatch Between Applications

**Symptom**: TypeScript errors in admin portal

**Solution**: Import types from `admin-shared.ts` in both applications

```typescript
// In admin portal
import type { Transaction } from '@binapex-trader/lib/types/admin-shared'
```

### Issue 4: Orphaned Admin Notifications

**Symptom**: Notifications pile up without clearing

**Solution**: Ensure admin portal marks notifications as read:

```sql
UPDATE admin_notifications
SET is_read = true
WHERE id = $1;
```

---

## Security Considerations

### Role-Based Access

- Always verify admin role before sensitive operations
- Use `is_admin()` RPC function for consistency
- Never trust client-side role checks

### Audit Logging

- All admin actions must call `log_admin_action()`
- Include old_values and new_values for compliance
- Store in `admin_audit_logs` table

### Password Security

- Withdrawal passwords stored hashed with bcrypt
- Admin cannot view plaintext passwords
- Password reset should generate new random password

### Data Privacy

- Sensitive fields (email, phone) should be masked in logs
- PII should not be included in error messages
- Admin access is logged in audit trail

---

## Development Workflow

### Making Changes to Shared Schema

1. Create migration in trader repo
2. Apply migration to Supabase
3. Update `admin-shared.ts` types
4. Test in both applications
5. Deploy trader first, then admin

### Adding New RPC Function

1. Create function in migration file
2. Add JSDoc comment describing function
3. Add TypeScript types to `admin-shared.ts`
4. Document in this file
5. Test from both applications

### Versioning Strategy

- Database migrations are versioned by timestamp
- RPC functions should maintain backwards compatibility
- Breaking changes require coordination between teams

---

## Performance Considerations

### Database Indexes

Ensure indexes exist for frequently queried columns:

```sql
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
```

### RPC Function Optimization

- Use `FOR UPDATE` locks for atomic operations
- Batch operations where possible
- Avoid N+1 queries in RPC functions

### Realtime Subscription Limits

- Supabase has connection limits (~200 connections)
- Unsubscribe from channels when component unmounts
- Use channel multiplexing for multiple subscriptions

---

## Contact & Support

For integration issues or questions:

- **Trader Repository**: aaron-ailabs/binapex-trader
- **Admin Repository**: aaron-ailabs/binapex-admin
- **Documentation**: /docs/ADMIN_INTEGRATION.md
- **Type Definitions**: /lib/types/admin-shared.ts

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial integration documentation |
| 2026-01-14 | 1.1.0 | Added support ticket structure, exchange rates, realtime hooks |
