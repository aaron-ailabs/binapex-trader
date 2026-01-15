/**
 * SHARED TYPE DEFINITIONS FOR ADMIN-TRADER INTEGRATION
 *
 * This file defines the contracts between binapex-trader and binapex-admin.
 * Both applications should reference these types to ensure consistency.
 *
 * IMPORTANT: Changes to these types may require coordination between both applications.
 *
 * Last Updated: 2026-01-14
 */

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export type UserRole = "admin" | "trader" | "moderator"

export type MembershipTier = "free" | "bronze" | "silver" | "gold" | "platinum"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: UserRole
  membership_tier: MembershipTier
  balance_usd: number
  bonus_balance: number
  kyc_verified: boolean
  kyc_status: "pending" | "approved" | "rejected" | null
  credit_score: number
  created_at: string
  updated_at: string
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export type TransactionType = "deposit" | "withdrawal" | "trade" | "bonus" | "fee"

export type TransactionStatus = "pending" | "approved" | "rejected" | "completed" | "failed"

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  amount_myr: number | null
  status: TransactionStatus
  method: string | null
  receipt_url: string | null
  admin_notes: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

// ============================================================================
// SUPPORT TICKET TYPES (Updated Structure)
// ============================================================================

export type SupportMessageSender = "user" | "admin"

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed"

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent"

export type SupportTicketCategory =
  | "deposit"
  | "withdrawal"
  | "trading"
  | "account"
  | "technical"
  | "other"

export interface SupportMessage {
  id: string
  user_id: string
  ticket_id: string
  sender_role: SupportMessageSender
  content: string
  category: SupportTicketCategory | null
  priority: SupportTicketPriority
  status: SupportTicketStatus
  attachment_url: string | null
  responded_by: string | null  // UUID of admin who responded
  responded_at: string | null
  is_read: boolean
  created_at: string
  updated_at: string
}

// Grouped ticket view for admin inbox
export interface SupportTicket {
  ticket_id: string
  user_id: string
  user_email: string
  user_name: string | null
  category: SupportTicketCategory | null
  priority: SupportTicketPriority
  status: SupportTicketStatus
  last_message: string
  last_sender: SupportMessageSender
  message_count: number
  unread_count: number
  created_at: string
  last_activity: string
}

// ============================================================================
// TRADE & ORDER TYPES
// ============================================================================

export type OrderSide = "buy" | "sell"

export type OrderType = "market" | "limit"

export type OrderStatus = "pending" | "partially_filled" | "filled" | "cancelled"

export interface LimitOrder {
  id: string
  user_id: string
  trading_pair_id: string
  side: OrderSide
  type: OrderType
  price: number
  amount: number
  filled_amount: number
  status: OrderStatus
  fee_percentage: number
  created_at: string
  updated_at: string
}

export type TradeType = "long" | "short"

export type TradeStatus = "open" | "closed" | "pending" | "settled"

export interface Trade {
  id: string
  user_id: string
  asset_id: string
  type: TradeType
  size: number
  leverage: number
  entry_price: number
  exit_price: number | null
  status: TradeStatus
  profit_loss: number | null
  settlement_time: string | null
  created_at: string
  closed_at: string | null
}

// ============================================================================
// EXCHANGE RATE TYPES
// ============================================================================

export interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  updated_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// ADMIN NOTIFICATION TYPES
// ============================================================================

export type AdminNotificationType = "deposit" | "withdrawal" | "trade" | "support" | "system"

export interface AdminNotification {
  id: string
  user_id: string | null
  type: AdminNotificationType
  message: string
  is_read: boolean
  created_at: string
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export type AdminAction =
  | "approve_deposit"
  | "reject_deposit"
  | "approve_withdrawal"
  | "reject_withdrawal"
  | "update_user_profile"
  | "update_credit_score"
  | "respond_to_ticket"
  | "update_exchange_rate"
  | "manage_asset"
  | "manage_trading_pair"

export interface AdminAuditLog {
  id: string
  admin_id: string
  entity_type: string
  entity_id: string
  action: AdminAction | string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  metadata: Record<string, any> | null
  created_at: string
}

// ============================================================================
// RPC FUNCTION PARAMETERS
// ============================================================================

export interface ApproveDepositParams {
  transaction_id: string
  admin_id: string
}

export interface ApproveWithdrawalParams {
  transaction_id: string
}

export interface RejectWithdrawalParams {
  transaction_id: string
  reason: string
}

export interface GetExchangeRateParams {
  p_from_currency: string
  p_to_currency: string
}

export interface LogAdminActionParams {
  p_entity_type: string
  p_entity_id: string
  p_action: string
  p_old_values?: Record<string, any>
  p_new_values?: Record<string, any>
  p_metadata?: Record<string, any>
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// ADMIN DASHBOARD STATS
// ============================================================================

export interface AdminStats {
  total_users: number
  active_trades: number
  pending_withdrawals: number
  pending_deposits: number
  total_volume_24h: number
  total_deposits_pending: number
  total_withdrawals_pending: number
  new_users_today: number
  unresolved_tickets: number
}

// ============================================================================
// PLATFORM CONFIGURATION
// ============================================================================

export interface PlatformBankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  qr_code_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  symbol: string
  name: string
  type: "crypto" | "forex" | "stock" | "commodity"
  current_price: number
  price_change_24h: number
  is_active: boolean
  payout_rate: number
  created_at: string
  updated_at: string
}

export interface TradingPair {
  id: string
  symbol: string
  base_asset: string
  quote_asset: string
  asset_type: "crypto" | "forex" | "stock" | "commodity"
  last_price: number
  buy_fee_percentage: number
  sell_fee_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// REALTIME SUBSCRIPTION PAYLOADS
// ============================================================================

export interface RealtimeInsertPayload<T = any> {
  eventType: "INSERT"
  new: T
  old: null
  schema: string
  table: string
}

export interface RealtimeUpdatePayload<T = any> {
  eventType: "UPDATE"
  new: T
  old: T
  schema: string
  table: string
}

export interface RealtimeDeletePayload<T = any> {
  eventType: "DELETE"
  new: null
  old: T
  schema: string
  table: string
}

export type RealtimePayload<T = any> =
  | RealtimeInsertPayload<T>
  | RealtimeUpdatePayload<T>
  | RealtimeDeletePayload<T>

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isUserRole(role: string): role is UserRole {
  return ["admin", "trader", "moderator"].includes(role)
}

export function isTransactionType(type: string): type is TransactionType {
  return ["deposit", "withdrawal", "trade", "bonus", "fee"].includes(type)
}

export function isTransactionStatus(status: string): status is TransactionStatus {
  return ["pending", "approved", "rejected", "completed", "failed"].includes(status)
}

export function isSupportTicketStatus(status: string): status is SupportTicketStatus {
  return ["open", "in_progress", "resolved", "closed"].includes(status)
}

export function isApiSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

export function isApiErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePositiveNumber(value: number): boolean {
  return typeof value === "number" && value > 0 && !isNaN(value)
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const USER_ROLES: UserRole[] = ["admin", "trader", "moderator"]

export const MEMBERSHIP_TIERS: MembershipTier[] = ["free", "bronze", "silver", "gold", "platinum"]

export const TRANSACTION_TYPES: TransactionType[] = ["deposit", "withdrawal", "trade", "bonus", "fee"]

export const TRANSACTION_STATUSES: TransactionStatus[] = ["pending", "approved", "rejected", "completed", "failed"]

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = ["open", "in_progress", "resolved", "closed"]

export const SUPPORT_TICKET_PRIORITIES: SupportTicketPriority[] = ["low", "normal", "high", "urgent"]

export const SUPPORT_TICKET_CATEGORIES: SupportTicketCategory[] = [
  "deposit",
  "withdrawal",
  "trading",
  "account",
  "technical",
  "other"
]

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_EXCHANGE_RATE = 4.45 // USD to MYR

export const DEFAULT_PAYOUT_RATE = 85 // 85% payout for binary options

export const DEFAULT_CREDIT_SCORE = 700

export const DEFAULT_MEMBERSHIP_TIER: MembershipTier = "free"

export const DEFAULT_USER_ROLE: UserRole = "trader"

// ============================================================================
// ADMIN PORTAL INTEGRATION NOTES
// ============================================================================

/**
 * INTEGRATION POINTS BETWEEN TRADER AND ADMIN:
 *
 * 1. DATABASE:
 *    - Shared Supabase project
 *    - RLS policies enforce role-based access
 *    - Admin has full access to all user data
 *
 * 2. RPC FUNCTIONS:
 *    - approve_deposit(transaction_id, admin_id)
 *    - approve_withdrawal(transaction_id)
 *    - reject_withdrawal(transaction_id, reason)
 *    - get_user_role(user_id)
 *    - get_exchange_rate(from_currency, to_currency)
 *    - log_admin_action(entity_type, entity_id, action, ...)
 *
 * 3. REALTIME SUBSCRIPTIONS:
 *    - support_messages: Live chat between users and admins
 *    - admin_notifications: New deposits, withdrawals, trades
 *    - transactions: Status updates
 *    - platform_bank_accounts: Changes to deposit options
 *
 * 4. STORAGE BUCKETS:
 *    - receipts: Deposit receipt images (admin can view all)
 *    - attachments: Support ticket attachments
 *
 * 5. API ENDPOINTS (Trader → Admin):
 *    - None (all integration is database-level via RPC)
 *
 * 6. MIDDLEWARE:
 *    - /admin/* paths redirect to https://admin.binapex.my
 *
 * 7. AUTHENTICATION:
 *    - Same Supabase Auth instance
 *    - Admin users have role='admin' in profiles table
 *    - Trader users have role='trader'
 *
 * 8. AUDIT TRAIL:
 *    - admin_audit_logs: All admin actions
 *    - unified_audit: System-wide audit trail
 */
