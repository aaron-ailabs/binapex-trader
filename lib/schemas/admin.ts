import { z } from "zod"

// Admin approval schemas
export const ApproveDepositSchema = z.object({
  depositId: z.string().uuid(),
  adminNotes: z.string().optional(),
})

export const RejectDepositSchema = z.object({
  depositId: z.string().uuid(),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
})

export const ApproveWithdrawalSchema = z.object({
  withdrawalId: z.string().uuid(),
  adminNotes: z.string().optional(),
})

export const RejectWithdrawalSchema = z.object({
  withdrawalId: z.string().uuid(),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
})

// User management schemas
export const UpdateUserSchema = z.object({
  userId: z.string().uuid(),
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  kyc_verified: z.boolean().optional(),
  membership_tier: z.enum(["free", "silver", "gold", "platinum"]).optional(),
  risk_mode: z.enum(["conservative", "moderate", "aggressive"]).optional(),
  balance_usd: z.number().nonnegative().optional(),
  bonus_balance: z.number().nonnegative().optional(),
})

export const UpdateCreditScoreSchema = z.object({
  userId: z.string().uuid(),
  newScore: z.number().int().min(0).max(1000),
  reason: z.string().min(1, "Reason is required"),
})

// Ticket management schemas
export const RespondToTicketSchema = z.object({
  ticketId: z.string().uuid(),
  response: z.string().min(1, "Response is required"),
})

export const UpdateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
})

// Bank account management schemas
export const AddPlatformBankSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required"),
  account_name: z.string().min(1, "Account name is required"),
  account_number: z.string().min(1, "Account number is required"),
  qr_code_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
})

export const UpdatePlatformBankSchema = z.object({
  id: z.string().uuid(),
  bank_name: z.string().min(1).optional(),
  account_name: z.string().min(1).optional(),
  account_number: z.string().min(1).optional(),
  qr_code_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
})

// Type exports
export type ApproveDepositInput = z.infer<typeof ApproveDepositSchema>
export type RejectDepositInput = z.infer<typeof RejectDepositSchema>
export type ApproveWithdrawalInput = z.infer<typeof ApproveWithdrawalSchema>
export type RejectWithdrawalInput = z.infer<typeof RejectWithdrawalSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UpdateCreditScoreInput = z.infer<typeof UpdateCreditScoreSchema>
export type RespondToTicketInput = z.infer<typeof RespondToTicketSchema>
export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusSchema>
export type AddPlatformBankInput = z.infer<typeof AddPlatformBankSchema>
export type UpdatePlatformBankInput = z.infer<typeof UpdatePlatformBankSchema>
