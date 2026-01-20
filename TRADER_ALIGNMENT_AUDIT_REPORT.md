# TRADER PORTAL ALIGNMENT AUDIT REPORT

**Date**: 2026-01-20
**Auditor**: Production Engineering Team
**Scope**: Binapex Trader Portal (binapex-trader)
**Objective**: Verify strict alignment with backend truth (database, RPCs, Realtime)

---

## EXECUTIVE SUMMARY

### OVERALL VERDICT: ⚠️ **CRITICAL MISALIGNMENTS DETECTED**

The Trader Portal has **4 CRITICAL violations** and **2 WARNING-level issues** that prevent it from being a pure consumer of backend truth. Frontend calculations, missing backend functions, and caching issues must be resolved immediately.

### RISK LEVEL: 🔴 HIGH

**Impact**:
- Data inconsistency between Admin and Trader portals
- Risk of incorrect P/L calculations
- Settlement flow is broken (missing RPC)
- Potential financial discrepancies

---

## DETAILED FINDINGS BY SECTION

### A. USER DETAILS (FULL) - ✅ **ALIGNED**

**Status**: Minimal user data is correctly sourced from backend.

**Evidence**:
- File: `contexts/auth-context.tsx`
- User data: `id`, `email`, `role`
- Source: `auth.users` + RPC `get_user_role()`

**Fields Verified**:
- ✅ user_id: from `supabase.auth.getUser()`
- ✅ email: from `auth.users`
- ✅ role: from RPC `get_user_role()`

**⚠️ WARNING**: 5-minute role cache (line 24)
```typescript
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
```

**Risk**: If admin changes user role, Trader won't reflect it for up to 5 minutes.

**Profile Data**:
- File: `app/dashboard/page.tsx` (line 17)
- Source: `profiles` table
- ✅ All profile fields come directly from database

**Missing Fields** (not critical):
- phone
- account_status (ACTIVE/SUSPENDED/BANNED)
- verification/KYC status

**Recommendation**: Consider reducing cache to 30 seconds or using Realtime for role changes.

---

### B. WALLET & BALANCE (CRITICAL) - ⚠️ **PARTIALLY ALIGNED**

**Status**: Balance reads from backend BUT has fallback logic that may cause inconsistency.

**Evidence**:
- File: `app/dashboard/page.tsx` (lines 19-30)

```typescript
// Fetch USD Wallet Balance (Source of Truth)
const { data: usdWallet } = await supabase
  .from("wallets")
  .select("balance")
  .eq("user_id", user.id)
  .eq("asset", "USD")
  .single()

// Use Wallet Balance if available, fallback to profile (legacy)
const displayBalance = usdWallet?.balance ?? profile?.balance_usd ?? 0
```

**Issues**:
1. ✅ PRIMARY: Wallet balance is sourced from `wallets` table
2. ⚠️ FALLBACK: Falls back to `profile.balance_usd` (legacy)
3. ❌ RISK: Two sources of truth can diverge

**Wallets Table Fields**:
- ✅ wallet_id: implicit (user_id + asset combination)
- ✅ asset: "USD"
- ✅ balance: read from `wallets.balance`
- ❓ available_balance: not used in dashboard

**Realtime Verification**:
- 🔍 Need to verify: Are wallet updates subscribed in Realtime?
- File to check: `components/dashboard/dashboard-client.tsx`

**FAIL CONDITION**: ❌
- If wallet update happens, does Trader UI update without refresh?
- **Action Required**: Test Realtime subscription for wallets table

**Recommendation**:
1. Remove fallback to `profile.balance_usd` - enforce single source of truth
2. Add Realtime subscription to wallets table
3. Add migration to ensure all users have USD wallet entry

---

### C. TRANSACTIONS (DEPOSITS / WITHDRAWALS) - ⚠️ **NEEDS VERIFICATION**

**Status**: No direct evidence found of transaction history display in audited files.

**Evidence**: Limited

**Expected Backend Source**:
- Table: `transactions`
- Fields: `id`, `type`, `amount`, `status`, `created_at`, `updated_at`

**Files to Audit**:
- `app/deposit/page.tsx` - Not audited in detail
- `app/withdrawal/page.tsx` - Not audited in detail
- Transaction history component - Not found

**Required Verification**:
1. Does Trader display transaction history?
2. Source: `transactions` table?
3. Realtime: Status changes propagate?

**Recommendation**: Full audit of transaction pages required.

---

### D. TRADES & ORDERS (CRITICAL) - 🔴 **SEVERELY MISALIGNED**

**Status**: **CRITICAL VIOLATION** - Frontend calculates P/L instead of reading from backend.

#### Issue 1: Frontend P/L Calculation

**Evidence**:
- File: `components/trading/active-positions.tsx` (lines 124-135)

```typescript
// Calculate P/L
let floatingPL = 0
let currentPrice = 0

if (isOpen) {
    currentPrice = currentPrices[trade.asset_symbol] || trade.strike_price || 0
    const diff = currentPrice - (trade.strike_price || 0)
    // Formula: (current - entry) * size
    if (isCall) floatingPL = diff * trade.amount
    else floatingPL = -diff * trade.amount
}
```

**❌ VIOLATION**: Trader is calculating P/L on frontend.

**Backend Source**:
- Table: `orders`
- Query: `app/actions/trades.ts` (lines 16-29)
- Fields read: ALL fields from `orders` table
- ✅ Status correctly read: `OPEN`, `WIN`, `LOSS`

**What Trader SHOULD Do**:
1. Read `profit_loss` field from `orders` table
2. Display as-is without calculation
3. Trust backend settlement

**What Trader IS Doing**:
1. ❌ Calculating floating P/L based on mock prices
2. ❌ Using formula instead of backend value
3. ❌ Simulating prices (see Issue 2)

#### Issue 2: Mock Price Simulation

**Evidence**:
- File: `components/trading/active-positions.tsx` (lines 82-98)

```typescript
// Mock Real-Time Price Simulation
useEffect(() => {
    const interval = setInterval(() => {
        setCurrentPrices(prev => {
            const next = { ...prev }
            trades.forEach(t => {
                if (t.status === 'OPEN') {
                    const base = next[t.asset_symbol] || t.strike_price || 100
                    const change = (Math.random() - 0.5) * (base * 0.001) // 0.1% volatility
                    next[t.asset_symbol] = base + change
                }
            })
            return next
        })
    }, 2000)
    return () => clearInterval(interval)
}, [trades])
```

**❌ VIOLATION**: Frontend is simulating asset prices with random numbers.

**What SHOULD Happen**:
1. Prices come from `assets` table (updated by market-data-cron)
2. Or from a market data API endpoint
3. Or via Realtime subscription to assets table

#### Issue 3: Frontend WIN Payout Calculation

**Evidence**:
- File: `components/trading/active-positions.tsx` (line 182)

```typescript
<Trophy size={10} /> +${(Number(trade.profit_loss || 0) + Number(trade.amount)).toFixed(2)}
```

**⚠️ PARTIAL**: Uses `trade.profit_loss` from backend (good) but adds `trade.amount` on frontend.

**Backend Should Provide**:
- `profit_loss`: Net profit (already includes stake return for WIN)
- OR separate `payout` field: Total returned to user

**Recommendation**: Clarify backend field semantics and display without frontend math.

#### Data Flow Analysis

**Current Flow (WRONG)**:
```
1. User places trade → Backend creates order
2. Backend sets status = 'OPEN'
3. Frontend fetches order ✅
4. Frontend simulates prices ❌
5. Frontend calculates P/L ❌
6. Frontend displays calculated result ❌
```

**Correct Flow (REQUIRED)**:
```
1. User places trade → Backend creates order
2. Backend sets status = 'OPEN'
3. Frontend fetches order ✅
4. Frontend subscribes to order changes via Realtime ✅
5. Backend settlement updates order:
   - status = 'WIN' or 'LOSS'
   - profit_loss = calculated amount
   - payout = total payout
6. Frontend displays backend values AS-IS ✅
```

**Realtime Subscription**:
- File: `components/trading/active-positions.tsx` (lines 53-72)
- ✅ GOOD: Subscribed to `orders` table changes
- ✅ GOOD: Plays sound on status change
- ✅ GOOD: Refetches trades on any change

---

### E. TRADE SETTLEMENT (CRITICAL) - 🔴 **COMPLETELY BROKEN**

**Status**: **CRITICAL FAILURE** - Settlement RPC does not exist.

#### Issue 1: Missing Settlement RPC

**Evidence**:
- File: `supabase/functions/settle-trades/index.ts` (line 77)

```typescript
const { data: settlement, error: rpcError } = await supabase.rpc('settle_binary_order', {
  p_order_id: order.id,
  p_outcome: outcome,
  p_final_price: currentPrice
})
```

**❌ CRITICAL**: RPC function `settle_binary_order` **DOES NOT EXIST** in database.

**Evidence**:
- Searched all migrations in `supabase/migrations/`
- No CREATE FUNCTION for `settle_binary_order`
- Available functions:
  - `execute_trade_atomic`
  - `place_order_atomic`
  - `cancel_order_atomic`
  - `request_withdrawal_atomic`
  - etc.

**Impact**:
1. ❌ Settlement edge function will FAIL when called
2. ❌ Trades will never be settled
3. ❌ Users will never see WIN/LOSS results
4. ❌ Wallet balances will never update with payouts

**Required Action**:
1. **URGENT**: Create `settle_binary_order` RPC function
2. Function must:
   - Update `orders.status` to 'WIN' or 'LOSS'
   - Set `orders.profit_loss`
   - Set `orders.final_price`
   - Update `wallets.balance` with payout
   - Create transaction record
   - Trigger notification
3. All operations must be ATOMIC (within transaction)

#### Issue 2: Settlement Flow Verification

**Current Settlement Process**:
1. Edge function `settle-trades` runs on schedule
2. Fetches orders where `status = 'OPEN'` AND `end_time <= NOW()`
3. Gets current price from market API
4. Determines WIN/LOSS
5. ❌ Calls non-existent RPC

**What SHOULD Happen After RPC Created**:
1. RPC updates orders table
2. Realtime propagates change to Trader
3. Trader displays WIN/LOSS (no calculation needed)
4. Wallet balance updates
5. Notification sent

**Verification Test** (After fix):
1. Place test trade in Trader
2. Wait for expiry
3. Edge function runs
4. Check: Order status updated WITHOUT refresh ✅
5. Check: Wallet balance updated ✅
6. Check: Notification received ✅

---

### F. NOTIFICATIONS - ✅ **FULLY ALIGNED**

**Status**: Notifications are correctly implemented and aligned with backend.

**Evidence**:
- File: `components/notifications/user-notification-bell.tsx`

**Backend Source**:
- Table: `user_notifications`
- Fields: `id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`

**Verification**:
- ✅ Fetches from backend (lines 44-55)
- ✅ Realtime subscription with user filter (lines 64-109)
- ✅ Mark-as-read persists to backend (lines 120-147)
- ✅ One backend event → one notification
- ✅ User sees only own notifications (RLS enforced)

**Realtime Implementation**:
```typescript
const channel = supabase
  .channel(`user_notifications:${user.id}`)
  .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "user_notifications",
      filter: `user_id=eq.${user.id}`,
  }, (payload) => {
      // Handle new notification
  })
  .subscribe()
```

**✅ EXCELLENT**: Proper implementation, no issues found.

---

### G. SUPPORT CHAT - ✅ **FULLY ALIGNED**

**Status**: Support chat is correctly implemented and aligned with backend.

**Evidence**:
- File: `components/support/chat-interface.tsx`

**Backend Source**:
- Table: `support_messages`
- Fields: `id`, `content`, `sender_role`, `created_at`, `is_read`, `attachment_url`

**Verification**:
- ✅ Fetches messages from backend (lines 72-91)
- ✅ Realtime subscription (lines 96-109)
- ✅ Mark-as-read persists (line 87)
- ✅ Messages filtered by `user_id` (RLS)
- ✅ Admin replies appear instantly via Realtime

**Widget Behavior**:
- Need to verify: Does widget block UI?
- Appears to be modal/dialog based (non-blocking)

**✅ GOOD**: Proper implementation, minimal concerns.

---

### H. REALTIME SUBSCRIPTIONS - ⚠️ **PARTIALLY IMPLEMENTED**

**Status**: Some subscriptions exist, others missing or need verification.

#### Subscriptions Found:

**1. Orders (Active Positions)**
- File: `components/trading/active-positions.tsx` (lines 53-72)
- Table: `orders`
- Filter: `type=eq.binary`
- Events: ALL (`*`)
- ✅ IMPLEMENTED

**2. User Notifications**
- File: `components/notifications/user-notification-bell.tsx` (lines 64-109)
- Table: `user_notifications`
- Filter: `user_id=eq.${user.id}`
- Events: INSERT
- ✅ IMPLEMENTED

**3. Support Messages**
- File: `components/support/chat-interface.tsx` (lines 96+)
- Table: `support_messages`
- Filter: `user_id=eq.${user.id}` (assumed)
- Events: INSERT, UPDATE (assumed)
- ✅ IMPLEMENTED

#### Subscriptions MISSING or UNVERIFIED:

**4. Wallets** ❌
- **CRITICAL**: No subscription found for wallet balance updates
- **Impact**: User won't see balance update after:
  - Deposit approval
  - Withdrawal
  - Trade settlement payout
- **Required**: Subscribe to `wallets` table filtered by `user_id`

**5. Transactions** ❓
- Status: UNVERIFIED
- Need: Subscription to `transactions` table for status changes
- Use case: Deposit status (PENDING → CONFIRMED → APPROVED)

**6. Assets (Market Prices)** ❓
- Status: UNVERIFIED
- Found: `hooks/use-market-prices.ts` (not audited in detail)
- Need: Verify if prices update via Realtime or polling

#### Realtime Best Practices Checklist:

- ✅ User-specific filters applied
- ✅ Channels properly cleaned up on unmount
- ⚠️ Some tables missing subscriptions (wallets)
- ❓ Error handling for subscription failures (not verified)

---

### I. EMPTY & ERROR STATES - ⚠️ **NEEDS VERIFICATION**

**Status**: Some empty states found, comprehensive audit needed.

#### Empty States Found:

**1. Active Positions**
- File: `components/trading/active-positions.tsx` (line 116)
```typescript
trades.length === 0 ? (
    <div className="text-gray-500 text-center text-xs p-4">No active positions</div>
)
```
- ✅ GOOD: Intentional empty state

**2. Notifications**
- File: `components/notifications/user-notification-bell.tsx` (lines 178-182)
```typescript
notifications.length === 0 ? (
    <div className="p-8 text-center text-sm text-zinc-600 flex flex-col items-center gap-2">
        <Bell className="h-8 w-8 opacity-20" />
        <span>No new notifications</span>
    </div>
)
```
- ✅ GOOD: Clear empty state with icon

#### Error States:

**Loading States**:
- File: `components/trading/active-positions.tsx` (lines 113-114)
```typescript
isLoading ? (
    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-amber-500" /></div>
)
```
- ✅ GOOD: Loading indicator

**Error Handling**:
- ❓ Need to verify: What happens if data fetch fails?
- ❓ Need to verify: Are error messages user-friendly?
- ❓ Need to verify: Do infinite loaders occur?

**New User Experience**:
- ❓ Need to verify: Does dashboard load cleanly for new user with no data?
- ❓ Potential issues:
  - No wallet record
  - No trades
  - No transactions

**Recommendation**:
1. Comprehensive empty/error state audit
2. Test with brand new user account
3. Simulate API failures
4. Ensure no infinite loaders

---

## ADDITIONAL FINDINGS

### Issue: Portfolio P/L Calculation on Frontend

**Evidence**:
- File: `app/dashboard/page.tsx` (lines 38-55)

```typescript
// Calculate 24h P/L based on Portfolio
let totalPortfolioValue = 0
let totalInvestedValue = 0

portfolio?.forEach(item => {
    const asset = assets?.find(a => a.symbol === item.symbol)
    if (asset) {
        const currentVal = item.amount * asset.current_price
        const investedVal = item.amount * item.average_buy_price
        totalPortfolioValue += currentVal
        totalInvestedValue += investedVal
    }
})

const totalPnL = totalPortfolioValue - totalInvestedValue
const pnlPercent = totalInvestedValue > 0 ? ((totalPnL / totalInvestedValue) * 100).toFixed(2) : "0.00"
```

**❌ VIOLATION**: Frontend is calculating portfolio P/L.

**Should Be**:
- Backend provides aggregate P/L via RPC or view
- OR backend provides calculated fields in portfolio table
- Trader displays value as-is

**Recommendation**: Create RPC function `get_portfolio_summary(p_user_id UUID)` that returns:
- `total_portfolio_value`
- `total_invested_value`
- `total_pnl`
- `pnl_percent`

---

## CRITICAL ACTION ITEMS

### IMMEDIATE (P0) - BLOCKING PRODUCTION

1. **Create `settle_binary_order` RPC** ⏰ URGENT
   - Location: New migration file
   - Must update: orders, wallets, transactions, notifications
   - Must be ATOMIC

2. **Remove Frontend P/L Calculation**
   - File: `components/trading/active-positions.tsx`
   - Action: Remove lines 82-98 (mock price simulation)
   - Action: Remove lines 124-135 (P/L calculation)
   - Action: Display `trade.profit_loss` as-is

3. **Add Wallets Realtime Subscription**
   - File: `components/dashboard/dashboard-client.tsx`
   - Subscribe to: `wallets` table
   - Filter: `user_id=eq.${user.id}`

### HIGH PRIORITY (P1) - BEFORE PRODUCTION

4. **Remove Portfolio P/L Calculation**
   - File: `app/dashboard/page.tsx`
   - Create: `get_portfolio_summary` RPC
   - Replace: Frontend calculation with RPC call

5. **Remove Wallet Balance Fallback**
   - File: `app/dashboard/page.tsx` (line 30)
   - Remove: `?? profile?.balance_usd ?? 0`
   - Ensure: All users have wallet records

6. **Reduce Role Cache Duration**
   - File: `contexts/auth-context.tsx` (line 24)
   - Change: 5 minutes → 30 seconds
   - Or: Use Realtime for role changes

### MEDIUM PRIORITY (P2) - POST-PRODUCTION

7. **Comprehensive Transaction Audit**
   - Audit: `app/deposit/page.tsx`
   - Audit: `app/withdrawal/page.tsx`
   - Verify: No frontend calculations
   - Verify: Realtime status updates

8. **Empty/Error State Audit**
   - Test: Brand new user experience
   - Test: API failure scenarios
   - Test: Network offline scenarios
   - Fix: Any infinite loaders

9. **Market Price Source Verification**
   - Audit: `hooks/use-market-prices.ts`
   - Verify: Prices from backend, not calculated
   - Verify: Realtime or acceptable polling interval

---

## COMPLIANCE CHECKLIST

### NON-NEGOTIABLE RULES

| Rule | Status | Evidence |
|------|--------|----------|
| 1. Trader must NOT derive or compute backend data | ❌ FAIL | P/L calculated on frontend |
| 2. Trader must NOT cache critical state | ⚠️ PARTIAL | 5-min role cache |
| 3. Trader must consume DB / RPC / Realtime only | ⚠️ PARTIAL | Missing wallets subscription |
| 4. If Admin settles, Trader must reflect instantly | ❌ FAIL | Settlement RPC missing |
| 5. Remove duplicated or legacy logic | ⚠️ PARTIAL | Wallet fallback logic exists |

---

## SETTLEMENT VERIFICATION PROCEDURE

**After fixes are deployed, perform this test:**

### Test 1: Trade Settlement Flow

```
1. Login as test user in Trader
2. Note current wallet balance: $____
3. Place binary trade:
   - Asset: BTC-USD
   - Direction: UP
   - Amount: $10
   - Duration: 30 seconds
4. Observe: Trade status = OPEN
5. Wait for expiry (30 seconds)
6. Verify WITHOUT REFRESH:
   - Trade status changes to WIN or LOSS ✅
   - Wallet balance updates ✅
   - Notification received ✅
7. Login as admin
8. Verify settlement matches Trader view ✅
```

### Test 2: Manual Settlement

```
1. Place trade in Trader (longer duration)
2. Login as Admin
3. Manually settle trade
4. Switch back to Trader (DO NOT REFRESH)
5. Verify: Changes appear instantly ✅
```

### Test 3: Balance Update

```
1. Note wallet balance
2. Admin approves a deposit
3. Verify in Trader WITHOUT REFRESH:
   - Balance updates instantly ✅
   - Notification received ✅
```

---

## FINAL VERDICT

### ALIGNMENT STATUS: 🔴 **NOT ALIGNED**

**Critical Blockers**:
1. ❌ Settlement RPC missing - **PRODUCTION BLOCKING**
2. ❌ Frontend P/L calculation - **DATA INTEGRITY RISK**
3. ❌ Mock price simulation - **USER DECEPTION**
4. ❌ Missing wallets Realtime - **UX ISSUE**

**The Trader Portal CANNOT GO TO PRODUCTION until P0 issues are resolved.**

### STOP RULE TRIGGERED

Per requirements:
> If WALLET, TRADES, or TRADE SETTLEMENT diverge → FAIL.

**Result**: ❌ **FAIL**

- **WALLET**: Partially aligned (missing Realtime)
- **TRADES**: Severely misaligned (frontend calculations)
- **TRADE SETTLEMENT**: Completely broken (missing RPC)

---

## RECOMMENDED TIMELINE

1. **Day 1**: Create `settle_binary_order` RPC
2. **Day 1**: Test settlement flow end-to-end
3. **Day 2**: Remove frontend calculations
4. **Day 2**: Add wallets Realtime subscription
5. **Day 3**: QA testing with admin/trader coordination
6. **Day 4**: Re-audit and verify all fixes
7. **Day 5**: Production deployment (if all green)

---

## CONCLUSION

The Binapex Trader Portal has solid foundations but **CRITICAL alignment issues** that must be fixed before production deployment. The most severe issue is the **missing settlement RPC**, which means the core trading functionality is currently non-functional.

Once the P0 issues are resolved, the system should operate as a proper consumer of backend truth with all updates propagating via Realtime without requiring page refreshes.

**Next Steps**:
1. Create missing `settle_binary_order` RPC immediately
2. Remove all frontend calculations
3. Add missing Realtime subscriptions
4. Perform comprehensive settlement testing
5. Re-audit for final production approval

---

**Audit Complete**
**Report Generated**: 2026-01-20
**Status**: FAIL - Critical Issues Found
**Recommendation**: DO NOT DEPLOY - Fix P0 issues first
