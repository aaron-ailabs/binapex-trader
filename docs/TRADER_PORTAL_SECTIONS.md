# Binapex Trader Portal - Complete Section Overview & Admin Connections

> **Last Updated**: 2026-01-12
> **Purpose**: Comprehensive documentation of every trader portal section and their connections to the admin portal

---

## Table of Contents

1. [Portal Overview](#portal-overview)
2. [Public Pages](#public-pages)
3. [Authentication Pages](#authentication-pages)
4. [Dashboard](#dashboard)
5. [Trading Section](#trading-section)
6. [Banking Operations](#banking-operations)
7. [Account Management](#account-management)
8. [Support System](#support-system)
9. [Admin Connection Architecture](#admin-connection-architecture)
10. [Database Trigger System](#database-trigger-system)
11. [Approval Workflows](#approval-workflows)

---

## Portal Overview

The Binapex Trader Portal is a **client-facing application** that allows users to:
- Trade multiple asset classes (crypto, forex, stocks, commodities)
- Manage deposits and withdrawals
- Track portfolio performance
- Access support services
- View trading history

The **Admin Portal** (separate application at `https://admin.binapex.my`) provides oversight and approval functionality for:
- Deposit approvals
- Withdrawal approvals
- Trade monitoring
- User management
- Platform configuration

---

## Public Pages

### 1. Landing Page (`/`)

**Route**: `/`
**File**: `/app/page.tsx`
**Access**: Public (no authentication required)

#### Purpose
Marketing and information page for prospective traders

#### Key Sections
1. **Hero Section** - Main value proposition with CTA
2. **Key Benefits** - Platform advantages (security, speed, variety)
3. **How It Works** - 4-step onboarding process
4. **Use Cases** - Day trading, long-term investing, diversification
5. **Markets Overview** - Asset classes available
6. **Security Section** - Trust indicators (licenses, encryption, compliance)
7. **Testimonials** - Social proof from traders
8. **FAQ** - Common questions
9. **Final CTA** - Sign-up encouragement

#### Components Used
```typescript
- Navbar (with login/signup links)
- Ticker (live price ticker)
- Hero, KeyBenefits, HowItWorks, UseCases
- MarketsOverview, SecuritySection
- Testimonials, FAQ, FinalCTA
- Footer
```

#### Database Tables
None - static content

#### Admin Connection
**None** - Public marketing page with no admin interaction

---

## Authentication Pages

### 2. Login Page (`/login`)

**Route**: `/login`
**File**: `/app/login/page.tsx`
**Access**: Public (redirects to `/dashboard` if already logged in)

#### Purpose
User authentication entry point

#### Features
- Email/password login form
- Client-side validation with Zod
- Error message display
- "Forgot Password?" link
- "Sign Up" redirect link

#### Form Schema
```typescript
LoginSchema = {
  email: string (email format)
  password: string (min 6 chars)
}
```

#### Authentication Method
```typescript
supabase.auth.signInWithPassword({ email, password })
```

#### Database Tables
- **Supabase Auth Tables** (auth.users)
- No direct table access

#### Admin Connection
**None** - Standard authentication flow

#### Security Features
- Password not logged or exposed
- Session cookies (httpOnly)
- CSRF protection via Supabase

---

### 3. Sign Up Page (`/signup`)

**Route**: `/signup`
**File**: `/app/signup/page.tsx`
**Access**: Public

#### Purpose
New trader registration

#### Form Fields
1. **Full Name** - User's complete name
2. **Email** - Unique email address
3. **Password** - Login password (min 6 chars)
4. **Withdrawal Password** - Separate security layer for withdrawals
5. **Terms Agreement** - T&C checkbox

#### Form Schema
```typescript
RegisterSchema = {
  full_name: string (min 2 chars)
  email: string (email format, unique)
  password: string (min 6 chars)
  withdrawal_password: string (min 6 chars, != password)
  terms: boolean (must be true)
}
```

#### API Route
**POST** `/api/auth/signup`

#### Registration Flow
```sql
1. Validate input (Zod schema)
2. Check email uniqueness
3. Create Supabase auth user
4. Insert into profiles table:
   - id (from auth.users.id)
   - full_name
   - email
   - role = 'user'
   - kyc_status = 'unverified'
   - membership_tier = 'bronze'
   - balance_usd = 0
   - bonus_balance = 0

5. Hash withdrawal password (bcrypt, 10 rounds)
6. Insert into user_withdrawal_secrets:
   - user_id
   - password_hash
   - created_at

7. Create USD wallet:
   - user_id
   - currency = 'USD'
   - balance = 0
   - locked_balance = 0
```

#### Database Tables Created
- `profiles` - User profile record
- `user_withdrawal_secrets` - Withdrawal password
- `wallets` - Initial USD wallet

#### Admin Connection
**Indirect** - New user appears in admin user list
- Admin can view user profile
- Admin can verify KYC
- Admin can adjust membership tier manually (if needed)

#### Security Features
- **Withdrawal password** separate from login password
- Bcrypt hashing (10 rounds)
- Unique email enforcement
- Terms agreement required

---

### 4. Forgot Password Page (`/forgot-password`)

**Route**: `/forgot-password`
**File**: `/app/forgot-password/page.tsx`
**Access**: Public

#### Purpose
Password reset initiation

#### Features
- Email submission form
- Password reset email sent via Supabase
- Redirect URL configured

#### Supabase Method
```typescript
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

#### Database Tables
None directly - Supabase handles email sending

#### Admin Connection
**None** - Automated password reset

---

## Dashboard

### 5. User Dashboard (`/dashboard`)

**Route**: `/dashboard`
**File**: `/app/dashboard/page.tsx`
**Access**: Protected (requires authentication)

#### Purpose
Main trading overview and account summary

#### Key Components

##### 5.1 Welcome Section
```typescript
- Greeting: "Welcome, {user.full_name}!"
- Current date display
```

##### 5.2 Stat Cards (4 cards)

**Card 1: USD Balance**
```typescript
Source: wallets.balance (WHERE currency = 'USD')
Display: "$X,XXX.XX"
Purpose: Available trading balance
```

**Card 2: Portfolio Value**
```typescript
Source: SUM(portfolio.quantity * assets.current_price)
Display: "$X,XXX.XX"
Purpose: Total value of holdings
```

**Card 3: Total P/L (Profit/Loss)**
```typescript
Calculation:
  (Current Portfolio Value) - (Total Cost Basis)
  where Cost Basis = SUM(portfolio.quantity * portfolio.avg_buy_price)
Display: "$X,XXX.XX" (green if positive, red if negative)
Percentage: "(+X.XX%)"
```

**Card 4: Bonus Balance**
```typescript
Source: profiles.bonus_balance
Display: "$X,XXX.XX"
Purpose: Platform-awarded bonuses
Admin-controlled: Yes
```

##### 5.3 Market Overview
```typescript
Display: Top 8 active assets
Columns:
  - Asset (name + symbol)
  - Price (current_price)
  - 24h Change (price_change_24h)
  - Action (Trade button → /trade?asset={symbol})

Source:
  SELECT * FROM assets
  WHERE is_active = true
  ORDER BY market_cap DESC
  LIMIT 8
```

##### 5.4 Portfolio Holdings
```typescript
Display: User's current positions
Columns:
  - Asset (name + symbol)
  - Quantity (portfolio.quantity)
  - Avg Buy Price (portfolio.avg_buy_price)
  - Current Price (assets.current_price)
  - P/L (calculated)

Calculation:
  P/L = (current_price - avg_buy_price) * quantity
  P/L % = ((current_price - avg_buy_price) / avg_buy_price) * 100

Source:
  SELECT p.*, a.current_price, a.name
  FROM portfolio p
  JOIN assets a ON p.asset_id = a.id
  WHERE p.user_id = {current_user_id}
  AND p.quantity > 0
```

##### 5.5 Quick Actions (4 buttons)
1. **Trade** → `/trade`
2. **Deposit** → `/deposit`
3. **Withdraw** → `/withdrawal`
4. **History** → `/history`

##### 5.6 Membership Tier Display
```typescript
Source: profiles.membership_tier
Display: Current tier with icon (Bronze, Silver, Gold, Platinum, Diamond)
Progress Bar: Shows progress to next tier based on total_trade_volume
```

##### 5.7 Credit Score Card
```typescript
Source: profiles.credit_score
Display: Score (0-1000) with visual indicator
Purpose: Trading reputation/limit eligibility
Admin Control: Yes (admin can adjust)
```

##### 5.8 GeoUpdater Component
```typescript
Purpose: Tracks user location for compliance/security
Method: Browser geolocation API
Stored: User session metadata
Admin Access: Yes (location logs viewable)
```

#### Database Tables Used
- `profiles` - User data, balance, membership, credit score
- `wallets` - USD balance and locked balance
- `assets` - Current prices, 24h changes
- `portfolio` - User holdings with avg buy price

#### Admin Connections

**Indirect Monitoring:**
1. **Credit Score**
   - Admin can view credit scores
   - Admin can manually adjust scores
   - Affects trading limits and features

2. **Membership Tier**
   - Automatically calculated based on `total_trade_volume`
   - Admin can manually override tier
   - Admin sees tier distribution

3. **Bonus Balance**
   - Admin can award bonuses
   - Admin can deduct bonuses
   - Tracked in transaction history

4. **Location Tracking**
   - Admin can view user locations
   - Used for compliance (restricted jurisdictions)
   - Fraud detection

**Admin Portal Views:**
- User dashboard showing all stats
- Credit score adjustment interface
- Bonus award interface
- Location compliance dashboard

---

## Trading Section

### 6. Trade Page (`/trade`)

**Route**: `/trade`
**File**: `/app/trade/page.tsx`
**Access**: Protected

#### Purpose
Binary options trading interface

#### Key Features

##### 6.1 Binary Options Interface
```typescript
Component: BinaryOptionsInterface
Features:
  - Asset selector (dropdown)
  - Direction selector (UP/DOWN)
  - Amount input (min $10, max based on balance)
  - Duration selector (30s, 1m, 5m, 15m, 30m, 1h)
  - Strike price display (current price)
  - Payout rate display (e.g., 75%)
  - Trade execution button
```

##### 6.2 Real-Time Balance
```typescript
Display: Available balance (USD + USDT)
Calculation: balance - locked_balance
Updates: Real-time via Supabase Realtime
```

##### 6.3 Trade Execution Flow
```typescript
1. User selects asset, direction, amount, duration
2. Client validates:
   - Amount >= $10
   - Amount <= available balance
   - Asset is active

3. Server Action: createTrade()
4. RPC Call: execute_binary_trade(
     p_user_id,
     p_amount,
     p_asset_symbol,
     p_direction,
     p_duration_seconds,
     p_strike_price,
     p_payout_rate
   )

5. Database Actions:
   - Deduct amount from wallet balance
   - Create order in 'orders' table
   - Status = 'OPEN'
   - Expiration = NOW() + duration

6. Admin Notification Triggered
7. Return trade confirmation to user
```

#### Database Tables Used
- `wallets` - Balance and locked_balance
- `orders` - Binary option orders
- `assets` - Current prices
- `admin_notifications` - Trade alert to admin

#### RPC Function
```sql
CREATE FUNCTION execute_binary_trade(
  p_user_id UUID,
  p_amount NUMERIC,
  p_asset_symbol VARCHAR,
  p_direction VARCHAR,  -- 'up' or 'down'
  p_duration_seconds INTEGER,
  p_strike_price NUMERIC,
  p_payout_rate NUMERIC
) RETURNS UUID
```

**Atomic Operations:**
1. Lock wallet row (`FOR UPDATE`)
2. Check available balance
3. Deduct amount from balance
4. Insert order record
5. Commit or rollback

#### Admin Connections

**Immediate Notification:**
```sql
TRIGGER: tr_notify_admin_on_direct_trade
FUNCTION: notify_admin_on_direct_trade()

Action: INSERT INTO admin_notifications
Message: "New Trade: {direction} on {asset} - Amount: ${amount}"
User: {user_id}
```

**Admin Portal Actions:**
1. **View Trade**
   - Admin sees all trades in real-time
   - Trade details: user, asset, amount, direction, duration

2. **Monitor Risk**
   - Admin sees total exposure by asset
   - Admin sees total exposure by user
   - Admin can set limits

3. **Settlement**
   - At expiration, admin portal shows results
   - Automatic settlement via cron job
   - Admin can manually settle if needed

**Admin Notification Fields:**
```typescript
{
  id: UUID
  user_id: UUID
  user_name: string
  user_email: string
  type: 'trade'
  message: "New Trade: up on BTC-USD - Amount: $100"
  created_at: timestamp
  is_read: boolean
}
```

---

### 7. History Page (`/history`)

**Route**: `/history`
**File**: `/app/history/page.tsx`
**Access**: Protected

#### Purpose
View complete trading and transaction history

#### Tabbed Interface

##### Tab 1: Transactions
```typescript
Query:
  SELECT * FROM transactions
  WHERE user_id = {current_user_id}
  ORDER BY created_at DESC
  LIMIT 20 OFFSET {page * 20}

Columns:
  - Date (created_at)
  - Type (deposit, withdrawal, bonus, commission)
  - Amount (amount)
  - Status (pending, approved, rejected, completed)
  - Receipt (receipt_url if deposit)
  - Admin Notes (admin_notes if rejected)

Status Colors:
  - pending: yellow
  - approved: green
  - rejected: red
  - completed: blue
```

##### Tab 2: Trades
```typescript
Query:
  SELECT t.*, a.name, a.symbol
  FROM trades t
  JOIN assets a ON t.asset_id = a.id
  WHERE t.user_id = {current_user_id}
  ORDER BY t.created_at DESC
  LIMIT 20 OFFSET {page * 20}

Columns:
  - Date (created_at)
  - Asset (asset.name)
  - Type (long/short)
  - Size (size)
  - Entry Price (entry_price)
  - Exit Price (exit_price)
  - P/L (calculated)
  - Status (open/closed)
```

##### Tab 3: Binary Orders
```typescript
Query:
  SELECT o.*, a.name, a.symbol
  FROM orders o
  JOIN assets a ON o.asset_symbol = a.symbol
  WHERE o.user_id = {current_user_id}
  ORDER BY o.created_at DESC
  LIMIT 20 OFFSET {page * 20}

Columns:
  - Date (created_at)
  - Asset (asset.name)
  - Direction (direction: up/down)
  - Amount (amount)
  - Strike Price (strike_price)
  - Close Price (close_price)
  - Status (OPEN, WIN, LOSS)
  - Payout (payout_amount)
  - Expiration (expires_at)

Status Colors:
  - OPEN: blue
  - WIN: green
  - LOSS: red
```

#### Pagination
```typescript
- 20 items per page
- Query parameter: ?page=N
- Navigation: Previous / Next buttons
```

#### Database Tables Used
- `transactions` - All financial transactions
- `trades` - Traditional trading positions
- `orders` - Binary options
- `assets` - Asset information for display

#### Admin Connections

**Transaction Status Visibility:**
1. **Pending Transactions**
   - User sees "pending" status
   - Admin has notification to review
   - User cannot cancel once submitted

2. **Approved Transactions**
   - User sees "approved" status
   - Deposit: Balance updated
   - Withdrawal: Payment processed

3. **Rejected Transactions**
   - User sees "rejected" status
   - Admin notes visible to user
   - Reason for rejection shown

**Admin Portal Synchronization:**
- Admin updates transaction status → User sees updated status immediately
- Admin adds notes → Notes appear in user history
- Real-time updates via Supabase Realtime (optional)

---

## Banking Operations

### 8. Deposit Page (`/deposit`)

**Route**: `/deposit`
**File**: `/app/deposit/page.tsx`
**Access**: Protected

#### Purpose
Fund account via bank transfer with receipt upload

#### Page Sections

##### 8.1 Current Balance Display
```typescript
Source: wallets.balance (USD)
Display: "$X,XXX.XX"
Purpose: Show available funds before deposit
```

##### 8.2 Platform Bank Accounts
```typescript
Source: platform_bank_accounts
Display: List of bank accounts for deposit

Fields:
  - Bank Name (bank_name)
  - Account Number (account_number)
  - Account Name (account_name)
  - Bank Code/SWIFT (optional)

Query:
  SELECT * FROM platform_bank_accounts
  WHERE is_active = true
  ORDER BY display_order
```

##### 8.3 Exchange Rate Display
```typescript
Source: exchange_rates table OR hardcoded
Current Rate: 1 USD = 4.45 MYR
Purpose: Help user calculate MYR amount to transfer
```

##### 8.4 Deposit Form
```typescript
Fields:
  1. Amount (USD) - min $50, max $1,000,000
  2. Receipt Upload - JPG/PNG/PDF, max 5MB
  3. Platform Bank Account (dropdown) - optional
  4. Submit button

Validation:
  - Amount: min $50, max $1,000,000
  - Receipt: required, valid file type, max 5MB
```

##### 8.5 Important Instructions
```
1. Transfer MYR amount to selected bank account
2. Upload transfer receipt
3. Wait for admin approval (typically 10-30 minutes)
4. Balance will update after approval
```

#### Deposit Flow (Step-by-Step)

**Step 1: User Submits Deposit**
```typescript
Action: submitDeposit()
Input: {
  amount: number (USD)
  receipt_url: string (from upload)
  platform_bank_account_id?: string
}

Validation:
  DepositSchema.parse(input)
```

**Step 2: Receipt Upload**
```typescript
API: POST /api/upload-receipt
Method: multipart/form-data
File: receipt (image/pdf)

Process:
  1. Validate file type (JPG, PNG, PDF)
  2. Validate file size (<= 5MB)
  3. Upload to Vercel Blob Storage
  4. Return URL

Rate Limit: 10 requests per minute
```

**Step 3: RPC Call**
```sql
CALL request_new_deposit(
  p_amount := {amount},
  p_receipt_url := {receipt_url},
  p_bank_id := {platform_bank_account_id}
)
```

**Step 4: Database Transaction**
```sql
BEGIN;
  -- Insert transaction record
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    status,
    receipt_url,
    platform_bank_account_id,
    created_at
  ) VALUES (
    {user_id},
    'deposit',
    {amount},
    'pending',
    {receipt_url},
    {bank_id},
    NOW()
  );

COMMIT;
```

**Step 5: Admin Notification Trigger**
```sql
TRIGGER: tr_notify_admin_on_transaction
FUNCTION: notify_admin_on_transaction()

Action:
  INSERT INTO admin_notifications (
    user_id,
    user_name,
    user_email,
    type,
    message,
    created_at
  ) VALUES (
    {user_id},
    {user.full_name},
    {user.email},
    'deposit',
    'User {name} ({email}) has uploaded a deposit receipt of ${amount}',
    NOW()
  );
```

**Step 6: User Sees Pending Status**
```typescript
- Redirect to /history
- Transaction shows as "pending"
- User waits for admin approval
```

#### Admin Approval Workflow

**Admin Portal - Deposit Review Page:**
```typescript
Display:
  - Notification: "New deposit: ${amount} from {user_name}"
  - User details: name, email, ID
  - Deposit details: amount, timestamp
  - Receipt preview: Image/PDF viewer
  - Actions: Approve | Reject

Admin Actions:
  1. View receipt
  2. Verify transfer in bank account
  3. Approve OR Reject with notes
```

**Admin Approves:**
```sql
CALL approve_deposit(
  transaction_id := {transaction_id},
  admin_id := {admin_user_id}
)

Function Logic:
  BEGIN;
    -- 1. Lock transaction
    SELECT * FROM transactions
    WHERE id = {transaction_id}
    FOR UPDATE;

    -- 2. Verify status is 'pending'
    IF status != 'pending' THEN
      RAISE EXCEPTION 'Transaction is not pending';
    END IF;

    -- 3. Update transaction
    UPDATE transactions
    SET status = 'approved',
        approved_at = NOW(),
        approved_by = {admin_id}
    WHERE id = {transaction_id};

    -- 4. Credit user wallet
    UPDATE wallets
    SET balance = balance + {amount}
    WHERE user_id = {user_id}
    AND currency = 'USD';

    -- 5. Update profile balance
    UPDATE profiles
    SET balance_usd = balance_usd + {amount}
    WHERE id = {user_id};

  COMMIT;
```

**Admin Rejects:**
```sql
UPDATE transactions
SET status = 'rejected',
    admin_notes = {rejection_reason}
WHERE id = {transaction_id};
```

#### User Sees Result
```typescript
Status: "approved" → Balance updated
Status: "rejected" → Admin notes visible
```

#### Database Tables Used
- `wallets` - Balance updates on approval
- `transactions` - Deposit record
- `platform_bank_accounts` - Bank account list
- `exchange_rates` - Currency conversion
- `profiles` - balance_usd field
- `admin_notifications` - Admin alert

#### Admin Portal Features

**1. Deposit Queue**
```typescript
Display: All pending deposits
Columns:
  - User (name, email)
  - Amount
  - Receipt (preview)
  - Timestamp
  - Actions (Approve/Reject)

Sort: Oldest first
Filter: By amount range, date range
```

**2. Deposit History**
```typescript
Display: All deposits (approved/rejected)
Columns:
  - User
  - Amount
  - Status
  - Approved By (admin name)
  - Timestamp
```

**3. Bank Reconciliation**
```typescript
Feature: Match deposits to bank transfers
Process:
  1. Export deposit list
  2. Compare with bank statement
  3. Mark as reconciled
```

---

### 9. Withdrawal Page (`/withdrawal`)

**Route**: `/withdrawal`
**File**: `/app/withdrawal/page.tsx`
**Access**: Protected

#### Purpose
Request fund withdrawal to user bank account

#### Page Sections

##### 9.1 Available Balance
```typescript
Calculation:
  Available = wallets.balance
            + profiles.bonus_balance
            - wallets.locked_balance

Display: "$X,XXX.XX"
Purpose: Show withdrawable amount
```

##### 9.2 Pending Withdrawals
```typescript
Query:
  SELECT * FROM transactions
  WHERE user_id = {user_id}
  AND type = 'withdrawal'
  AND status = 'pending'
  ORDER BY created_at DESC

Display: Table with:
  - Amount
  - Requested At
  - Status (always 'pending' here)
  - Cancel button (if applicable)
```

##### 9.3 User Bank Accounts
```typescript
Source: user_banks table

Display: Saved bank accounts
Columns:
  - Bank Name
  - Account Number (masked: **1234)
  - Account Name
  - Select button

Add New: Link to add bank account
```

##### 9.4 Withdrawal Form
```typescript
Fields:
  1. Amount (USD) - min $50, max available balance
  2. Method - BANK or EWALLET
  3. Payout Details:
     - Bank Name
     - Account Number
     - Account Name
     OR
     - Wallet Provider (e.g., GrabPay, Touch 'n Go)
     - Wallet ID
  4. Withdrawal Password (required)
  5. Submit button

Validation:
  - Amount: >= $50, <= available balance
  - Method: BANK or EWALLET
  - Withdrawal password: required, verified
```

##### 9.5 Withdrawal Password Check
```typescript
On Page Load:
  1. Check if user has withdrawal password
  2. Query: SELECT EXISTS(
       SELECT 1 FROM user_withdrawal_secrets
       WHERE user_id = {user_id}
     )
  3. If false → Redirect to /settings?setup_withdrawal_password=true
  4. If true → Show form
```

#### Withdrawal Flow (Step-by-Step)

**Step 1: User Submits Withdrawal**
```typescript
Action: submitWithdrawal()
Input: {
  amount: number
  method: 'BANK' | 'EWALLET'
  payout_details: {
    bank_name?: string
    account_number?: string
    account_name?: string
    wallet_provider?: string
    wallet_id?: string
  }
  withdrawal_password: string
}

Validation:
  WithdrawalSchema.parse(input)
```

**Step 2: Password Verification**
```sql
-- Happens inside RPC
SELECT password_hash
FROM user_withdrawal_secrets
WHERE user_id = {user_id};

-- Verify with bcrypt.compare()
IF NOT bcrypt.compare(password, password_hash) THEN
  RAISE EXCEPTION 'Invalid withdrawal password';
END IF;
```

**Step 3: RPC Call**
```sql
CALL request_new_withdrawal(
  p_amount_usd := {amount},
  p_amount_myr := {amount * 4.45},
  p_method := {method},
  p_payout_details := {payout_details},
  p_password := {withdrawal_password}
)
```

**Step 4: Database Transaction**
```sql
BEGIN;
  -- 1. Verify withdrawal password
  SELECT password_hash INTO v_hash
  FROM user_withdrawal_secrets
  WHERE user_id = {user_id};

  -- bcrypt verification (in application layer)
  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid withdrawal password';
  END IF;

  -- 2. Lock wallet
  SELECT balance, locked_balance INTO v_balance, v_locked
  FROM wallets
  WHERE user_id = {user_id} AND currency = 'USD'
  FOR UPDATE;

  -- 3. Check available balance
  IF (v_balance - v_locked) < {amount} THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 4. Lock withdrawal amount
  UPDATE wallets
  SET locked_balance = locked_balance + {amount}
  WHERE user_id = {user_id} AND currency = 'USD';

  -- 5. Insert transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    amount_myr,
    status,
    method,
    payout_details,
    created_at
  ) VALUES (
    {user_id},
    'withdrawal',
    {amount},
    {amount_myr},
    'pending',
    {method},
    {payout_details},
    NOW()
  );

COMMIT;
```

**Step 5: Admin Notification Trigger**
```sql
TRIGGER: tr_notify_admin_on_transaction
FUNCTION: notify_admin_on_transaction()

Action:
  INSERT INTO admin_notifications (
    user_id,
    user_name,
    user_email,
    type,
    message,
    created_at
  ) VALUES (
    {user_id},
    {user.full_name},
    {user.email},
    'withdrawal',
    'User {name} ({email}) has requested withdrawal of ${amount} (RM{amount_myr})',
    NOW()
  );
```

**Step 6: User Sees Pending Status**
```typescript
- Amount locked in wallet
- Transaction shows as "pending"
- User waits for admin approval
```

#### Admin Approval Workflow

**Admin Portal - Withdrawal Review Page:**
```typescript
Display:
  - Notification: "New withdrawal: ${amount} from {user_name}"
  - User details: name, email, ID, balance
  - Withdrawal details:
    * Amount: ${amount} ($X,XXX.XX)
    * Amount (MYR): RM X,XXX.XX
    * Method: BANK or EWALLET
    * Payout Details:
      - Bank Name, Account Number, Account Name
      OR
      - Wallet Provider, Wallet ID
    * Requested At: timestamp
  - Actions: Approve | Reject

Admin Actions:
  1. Verify user balance
  2. Verify payout details
  3. Process payment externally
  4. Approve OR Reject with notes
```

**Admin Approves:**
```sql
CALL approve_withdrawal(
  transaction_id := {transaction_id}
)

Function Logic:
  BEGIN;
    -- 1. Lock transaction
    SELECT amount, user_id, status
    FROM transactions
    WHERE id = {transaction_id}
    FOR UPDATE;

    -- 2. Verify status is 'pending'
    IF status != 'pending' THEN
      RAISE EXCEPTION 'Transaction is not pending';
    END IF;

    -- 3. Update transaction
    UPDATE transactions
    SET status = 'approved',
        approved_at = NOW(),
        approved_by = {admin_id}
    WHERE id = {transaction_id};

    -- 4. Deduct from wallet
    UPDATE wallets
    SET balance = balance - {amount},
        locked_balance = locked_balance - {amount}
    WHERE user_id = {user_id}
    AND currency = 'USD';

    -- 5. Update profile balance
    UPDATE profiles
    SET balance_usd = balance_usd - {amount}
    WHERE id = {user_id};

  COMMIT;
```

**Admin Rejects:**
```sql
BEGIN;
  -- 1. Update transaction
  UPDATE transactions
  SET status = 'rejected',
      admin_notes = {rejection_reason}
  WHERE id = {transaction_id};

  -- 2. Unlock funds
  UPDATE wallets
  SET locked_balance = locked_balance - {amount}
  WHERE user_id = {user_id}
  AND currency = 'USD';

COMMIT;
```

#### User Sees Result
```typescript
Status: "approved"
  → Locked balance released
  → Balance deducted
  → Payment sent to bank/wallet

Status: "rejected"
  → Locked balance released
  → Balance returned
  → Admin notes visible
```

#### Database Tables Used
- `wallets` - Balance and locked_balance
- `transactions` - Withdrawal record
- `user_banks` - User's bank accounts
- `user_withdrawal_secrets` - Password verification
- `profiles` - bonus_balance, balance_usd
- `admin_notifications` - Admin alert

#### Security Features

**1. Withdrawal Password**
```typescript
Purpose: Prevent unauthorized withdrawals
Requirement: Separate from login password
Verification: On every withdrawal
Hashing: bcrypt (10 rounds)
```

**2. Locked Balance**
```typescript
Purpose: Prevent double withdrawal
Process:
  1. Withdraw requested → Lock amount
  2. Admin approves → Deduct and unlock
  3. Admin rejects → Unlock amount

Ensures: User cannot withdraw locked funds
```

**3. Admin Verification**
```typescript
Purpose: Fraud prevention
Checks:
  - User balance sufficient
  - Payout details valid
  - No suspicious activity
  - User account in good standing
```

#### Admin Portal Features

**1. Withdrawal Queue**
```typescript
Display: All pending withdrawals
Columns:
  - User (name, email)
  - Amount (USD + MYR)
  - Method (BANK/EWALLET)
  - Payout Details
  - Timestamp
  - Actions (Approve/Reject)

Sort: Oldest first
Priority: Large amounts flagged
```

**2. Withdrawal History**
```typescript
Display: All withdrawals (approved/rejected)
Columns:
  - User
  - Amount
  - Status
  - Approved By (admin name)
  - Timestamp
```

**3. Fraud Detection**
```typescript
Alerts:
  - Multiple withdrawals in short time
  - Withdrawal to new bank account
  - Large withdrawal (> $10,000)
  - Withdrawal shortly after deposit
```

---

## Account Management

### 10. Settings Page (`/settings`)

**Route**: `/settings`
**File**: `/app/settings/page.tsx`
**Access**: Protected

#### Purpose
Account configuration and security management

#### Sections

##### 10.1 Profile Settings
```typescript
Fields:
  - Full Name (editable)
  - Email (read-only)
  - Phone Number (editable)
  - Date of Birth (editable)
  - Country (editable)
  - Profile Picture Upload

Action: Update Profile button
```

##### 10.2 Withdrawal Password
```typescript
Setup (if not configured):
  - New Withdrawal Password
  - Confirm Withdrawal Password
  - Submit

Update (if configured):
  - Current Withdrawal Password
  - New Withdrawal Password
  - Confirm New Withdrawal Password
  - Submit

Validation:
  - Min 6 characters
  - Cannot be same as login password
  - Must match confirmation
```

##### 10.3 Login Password
```typescript
Change Password:
  - Current Password
  - New Password
  - Confirm New Password
  - Submit

Uses Supabase: auth.updateUser({ password })
```

##### 10.4 KYC Verification (if applicable)
```typescript
Status: Unverified | Pending | Verified
Documents:
  - ID Card / Passport
  - Proof of Address
  - Selfie with ID

Admin reviews and approves
```

#### Server Actions
```typescript
- updateProfile() - Updates profiles table
- updateWithdrawalPassword() - Updates user_withdrawal_secrets
- updateLoginPassword() - Supabase auth update
```

#### Database Tables Used
- `profiles` - User profile data
- `user_withdrawal_secrets` - Withdrawal password

#### Admin Connections

**KYC Approval:**
- Admin reviews submitted documents
- Admin approves/rejects KYC
- Status updated in profiles.kyc_status

**No Direct Admin Interaction:**
- Profile updates are self-service
- Password changes are self-service

---

### 11. Membership Page (`/membership`)

**Route**: `/membership`
**File**: `/app/membership/page.tsx`
**Access**: Protected

#### Purpose
Display membership tier and benefits

#### Content

##### 11.1 Current Tier
```typescript
Display:
  - Tier Name (Bronze, Silver, Gold, Platinum, Diamond)
  - Tier Icon/Badge
  - Progress Bar to next tier
  - Current Trade Volume: $X,XXX
  - Next Tier Requirement: $Y,YYY

Source:
  profiles.membership_tier
  profiles.total_trade_volume
```

##### 11.2 Tier Benefits
```typescript
Display: Benefits of current tier
Examples:
  - Bronze: Basic trading, 0.1% cashback
  - Silver: Priority support, 0.2% cashback
  - Gold: Dedicated manager, 0.3% cashback
  - Platinum: VIP events, 0.5% cashback
  - Diamond: Custom limits, 1% cashback
```

##### 11.3 All Tiers Grid
```typescript
Display: Comparison table
Columns:
  - Tier Name
  - Trade Volume Requirement
  - Benefits
  - Cashback Rate
  - Withdrawal Limit
```

##### 11.4 Bonus Balance
```typescript
Display: Current bonus balance
Source: profiles.bonus_balance
Admin Control: Yes
```

##### 11.5 Lifetime Deposits
```typescript
Display: Total lifetime deposits
Calculation: SUM of all approved deposits
```

#### Database Tables Used
- `profiles` - membership_tier, total_trade_volume, bonus_balance

#### Admin Connections

**Tier Management:**
1. **Automatic Tier Upgrades**
   - Based on total_trade_volume
   - Triggered by database function
   - Admin can view upgrade history

2. **Manual Tier Adjustments**
   - Admin can manually upgrade/downgrade
   - Admin can award special VIP tiers
   - Logged in admin_logs

3. **Bonus Awards**
   - Admin can award bonuses
   - Admin can set bonus expiration
   - Tracked in transactions

---

## Support System

### 12. Support Page (`/support`)

**Route**: `/support`
**File**: `/app/support/page.tsx`
**Access**: Protected

#### Purpose
Customer support and help center

#### Sections

##### 12.1 Live Chat Interface
```typescript
Component: SupportClientPage
Features:
  - Real-time messaging
  - WhatsApp-style UI (gold theme)
  - Message history
  - File attachments (images, PDFs)
  - Read receipts
  - Typing indicators

Database:
  - support_messages table
  - Message routing to available agents
```

##### 12.2 FAQ Section
```typescript
Component: FAQSection
Categories:
  - Account & Registration
  - Deposits & Withdrawals
  - Trading
  - Security
  - Technical Issues

Expandable accordion format
```

##### 12.3 Support Widget (Global)
```typescript
Location: Bottom-right corner (all pages)
Component: SupportWidget
Features:
  - Floating chat button
  - Unread message count
  - Quick access to support
```

#### Database Tables Used
- `support_messages` - Chat messages
- `support_tickets` - Support tickets (if applicable)

#### Admin Connections

**Support Agent Dashboard:**
1. **Message Queue**
   - All incoming messages
   - Assigned to available agents
   - Priority for VIP members

2. **Agent Responses**
   - Agents reply via admin portal
   - Messages appear in user's chat
   - Real-time via WebSocket

3. **Ticket Management**
   - Create tickets from chats
   - Assign to departments
   - Track resolution time

**Admin Portal Features:**
- Live chat dashboard
- Canned responses
- User history lookup
- Escalation to senior support

---

## Admin Connection Architecture

### Overview

The trader portal and admin portal are **separate applications** connected via:
1. **Shared Database** (PostgreSQL via Supabase)
2. **Database Triggers** (automatic notifications)
3. **RPC Functions** (approval workflows)
4. **Realtime Subscriptions** (status updates)

### Connection Patterns

#### Pattern 1: Notification System
```
Trader Action → Database Insert → Trigger → Admin Notification
```

**Example: Deposit**
```sql
User uploads receipt
  → INSERT INTO transactions (type='deposit', status='pending')
    → TRIGGER tr_notify_admin_on_transaction
      → INSERT INTO admin_notifications
        → Admin sees notification in admin portal
```

#### Pattern 2: Approval Workflow
```
Trader Request → Pending Status → Admin Review → Approval → Status Update
```

**Example: Withdrawal**
```sql
User requests withdrawal
  → CALL request_new_withdrawal()
    → Status = 'pending', locked_balance += amount
      → Admin reviews
        → CALL approve_withdrawal()
          → Status = 'approved', balance -= amount, locked_balance -= amount
            → User sees updated status
```

#### Pattern 3: Monitoring
```
Trader Activity → Database Insert → Admin Dashboard Display
```

**Example: Trading**
```sql
User places trade
  → INSERT INTO orders
    → TRIGGER tr_notify_admin_on_direct_trade
      → Admin sees trade in monitoring dashboard
```

### Data Flow Diagram

```
┌─────────────────┐
│  TRADER PORTAL  │
└────────┬────────┘
         │
         │ (1) User Action
         ▼
┌─────────────────┐
│   SUPABASE DB   │
│                 │
│  • transactions │
│  • orders       │
│  • trades       │
│  • wallets      │
└────────┬────────┘
         │
         │ (2) Database Trigger
         ▼
┌─────────────────────┐
│ admin_notifications │
└────────┬────────────┘
         │
         │ (3) Realtime or Polling
         ▼
┌─────────────────┐
│  ADMIN PORTAL   │
│                 │
│ • Review Queue  │
│ • Approve/Reject│
└────────┬────────┘
         │
         │ (4) Admin Action (RPC)
         ▼
┌─────────────────┐
│   SUPABASE DB   │
│                 │
│ • Update Status │
│ • Update Balance│
└────────┬────────┘
         │
         │ (5) Status Update
         ▼
┌─────────────────┐
│  TRADER PORTAL  │
│                 │
│ • Status Display│
└─────────────────┘
```

---

## Database Trigger System

### Trigger 1: Transaction Notifications

**Trigger Name**: `tr_notify_admin_on_transaction`
**Table**: `transactions`
**Event**: AFTER INSERT

**Function**: `notify_admin_on_transaction()`

```sql
CREATE OR REPLACE FUNCTION notify_admin_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Fetch user details
  SELECT full_name, email INTO v_user_name, v_user_email
  FROM profiles
  WHERE id = NEW.user_id;

  -- Notify on Deposit
  IF (TG_OP = 'INSERT') AND (NEW.type = 'deposit') THEN
    INSERT INTO admin_notifications (
      user_id, user_name, user_email, type, message
    ) VALUES (
      NEW.user_id,
      v_user_name,
      v_user_email,
      'deposit',
      concat('User ', v_user_name, ' (', v_user_email, ') has uploaded a deposit receipt of $', NEW.amount)
    );
  END IF;

  -- Notify on Withdrawal
  IF (TG_OP = 'INSERT') AND (NEW.type = 'withdrawal') THEN
    INSERT INTO admin_notifications (
      user_id, user_name, user_email, type, message
    ) VALUES (
      NEW.user_id,
      v_user_name,
      v_user_email,
      'withdrawal',
      concat('User ', v_user_name, ' (', v_user_email, ') has requested withdrawal of $', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Purpose**: Automatically notify admins when users deposit or withdraw

---

### Trigger 2: Trade Notifications (Order Book)

**Trigger Name**: `tr_notify_admin_on_trade`
**Table**: `executed_trades`
**Event**: AFTER INSERT

**Function**: `notify_admin_on_trade()`

```sql
CREATE OR REPLACE FUNCTION notify_admin_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  v_pair_symbol TEXT;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  SELECT symbol INTO v_pair_symbol
  FROM trading_pairs
  WHERE id = NEW.trading_pair_id;

  SELECT full_name, email INTO v_user_name, v_user_email
  FROM profiles
  WHERE id = NEW.buyer_id;

  INSERT INTO admin_notifications (
    user_id, user_name, user_email, type, message
  ) VALUES (
    NEW.buyer_id,
    v_user_name,
    v_user_email,
    'trade',
    concat('User ', v_user_name, ' - Trade executed: ', NEW.amount, ' ', v_pair_symbol, ' at $', NEW.price)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Purpose**: Notify admins when order book trades execute

---

### Trigger 3: Binary Trade Notifications

**Trigger Name**: `tr_notify_admin_on_direct_trade`
**Table**: `trades`
**Event**: AFTER INSERT

**Function**: `notify_admin_on_direct_trade()`

```sql
CREATE OR REPLACE FUNCTION notify_admin_on_direct_trade()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  SELECT full_name, email INTO v_user_name, v_user_email
  FROM profiles
  WHERE id = NEW.user_id;

  INSERT INTO admin_notifications (
    user_id, user_name, user_email, type, message
  ) VALUES (
    NEW.user_id,
    v_user_name,
    v_user_email,
    'trade',
    concat('User ', v_user_name, ' - New Trade: ', NEW.type, ' on ', NEW.asset_symbol, ' - Amount: $', NEW.amount)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Purpose**: Notify admins when users place binary options or direct trades

---

## Approval Workflows

### Workflow 1: Deposit Approval

**User Side:**
1. User uploads deposit receipt
2. Status = 'pending'
3. User waits

**Admin Side:**
1. Admin sees notification
2. Admin views receipt
3. Admin verifies bank transfer
4. Admin calls `approve_deposit(transaction_id, admin_id)`

**RPC Function:**
```sql
CREATE OR REPLACE FUNCTION approve_deposit(
  transaction_id UUID,
  admin_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount numeric;
  v_user_id uuid;
  v_status text;
BEGIN
  -- 1. Lock transaction
  SELECT amount, user_id, status
  INTO v_amount, v_user_id, v_status
  FROM transactions
  WHERE id = transaction_id
  FOR UPDATE;

  -- 2. Verify status
  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Transaction is not pending';
  END IF;

  -- 3. Update transaction
  UPDATE transactions
  SET status = 'approved',
      approved_at = NOW(),
      approved_by = admin_id
  WHERE id = transaction_id;

  -- 4. Credit wallet
  UPDATE wallets
  SET balance = balance + v_amount
  WHERE user_id = v_user_id
  AND currency = 'USD';

  -- 5. Update profile
  UPDATE profiles
  SET balance_usd = balance_usd + v_amount
  WHERE id = v_user_id;
END;
$$;
```

**Result:**
- Status = 'approved'
- Balance updated
- User sees updated balance

---

### Workflow 2: Withdrawal Approval

**User Side:**
1. User submits withdrawal with password
2. Status = 'pending'
3. Amount locked in wallet
4. User waits

**Admin Side:**
1. Admin sees notification
2. Admin verifies payout details
3. Admin processes payment externally
4. Admin calls `approve_withdrawal(transaction_id)`

**RPC Function:**
```sql
CREATE OR REPLACE FUNCTION approve_withdrawal(
  transaction_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount numeric;
  v_user_id uuid;
  v_status text;
BEGIN
  -- 1. Lock transaction
  SELECT amount, user_id, status
  INTO v_amount, v_user_id, v_status
  FROM transactions
  WHERE id = transaction_id
  FOR UPDATE;

  -- 2. Verify status
  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Transaction is not pending';
  END IF;

  -- 3. Update transaction
  UPDATE transactions
  SET status = 'approved',
      approved_at = NOW()
  WHERE id = transaction_id;

  -- 4. Deduct from wallet (unlock and deduct)
  UPDATE wallets
  SET balance = balance - v_amount,
      locked_balance = locked_balance - v_amount
  WHERE user_id = v_user_id
  AND currency = 'USD';

  -- 5. Update profile
  UPDATE profiles
  SET balance_usd = balance_usd - v_amount
  WHERE id = v_user_id;
END;
$$;
```

**Result:**
- Status = 'approved'
- Balance deducted
- Locked balance released
- User sees updated balance

---

### Workflow 3: Rejection

**Admin Action:**
```sql
UPDATE transactions
SET status = 'rejected',
    admin_notes = 'Reason for rejection'
WHERE id = transaction_id;

-- If withdrawal, unlock funds
UPDATE wallets
SET locked_balance = locked_balance - amount
WHERE user_id = v_user_id;
```

**User Side:**
- User sees "rejected" status
- Admin notes displayed
- Funds unlocked (if withdrawal)

---

## Summary Table: Admin Interactions by Section

| Trader Portal Section | Admin Portal Feature | Trigger/Function | Admin Action Required |
|----------------------|---------------------|------------------|----------------------|
| **Sign Up** | User Management | N/A | None (auto-create) |
| **Dashboard** | User Dashboard | N/A | View only |
| **Trade** | Trade Monitoring | `notify_admin_on_direct_trade()` | Monitor (no approval) |
| **History** | Transaction History | N/A | View only |
| **Deposit** | Deposit Approval Queue | `notify_admin_on_transaction()` | **Approve/Reject Required** |
| **Withdrawal** | Withdrawal Approval Queue | `notify_admin_on_transaction()` | **Approve/Reject Required** |
| **Settings** | User Profile | N/A | KYC approval if enabled |
| **Membership** | Tier Management | N/A | Manual tier adjustment (optional) |
| **Support** | Support Dashboard | N/A | Respond to messages |

---

## Key Takeaways

1. **Two Critical Approval Points:**
   - Deposits require admin approval AFTER receipt upload
   - Withdrawals require admin approval AFTER user request

2. **Automatic Notifications:**
   - All deposits, withdrawals, and trades trigger admin notifications
   - Implemented via database triggers (not application code)

3. **Security Layers:**
   - Withdrawal password (separate from login)
   - Locked balance during pending withdrawals
   - Admin verification before fund disbursement

4. **No Direct Communication:**
   - Traders don't email/call admins for approvals
   - System generates notifications automatically
   - Admins work from queues in admin portal

5. **Real-Time Updates:**
   - Status changes reflect immediately
   - Balance updates are atomic (ACID compliant)
   - Supabase Realtime can push updates to trader UI

6. **Admin Portal is Separate App:**
   - Different domain (admin.binapex.my)
   - Shared database only
   - Separate authentication (admin role required)

---

## Conclusion

The Binapex platform uses a **robust two-tier architecture** where:
- **Trader Portal** = User-facing application for trading and account management
- **Admin Portal** = Internal application for oversight and approvals
- **Connection** = Shared database with triggers and RPC functions

This architecture ensures:
✅ Clear separation of concerns
✅ Automated notification system
✅ Secure approval workflows
✅ Audit trails for compliance
✅ Scalable and maintainable codebase

**For Developers:**
- Always use RPC functions for financial operations
- Never bypass approval workflows
- Test triggers thoroughly
- Monitor admin notification queue
- Ensure transaction atomicity

**For Admins:**
- Check notification queue regularly
- Verify receipts/payout details before approval
- Add clear rejection notes
- Monitor fraud indicators
- Use audit logs for compliance
