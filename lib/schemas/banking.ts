import { z } from "zod"

export const DepositSchema = z.object({
  amount: z
    .number()
    .min(50, "Minimum deposit is $50")
    .max(1000000, "Maximum deposit is $1,000,000")
    .positive("Amount must be positive"),
  receipt: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(file.type),
      "Only JPG, PNG, and PDF files are allowed",
    ),
})

export const WithdrawalSchema = z.object({
  amount: z
    .number()
    .min(100, "Minimum withdrawal is $100")
    .max(1000000, "Maximum withdrawal is $1,000,000")
    .positive("Amount must be positive"),
  bank_account_id: z.string().min(1, "Please select a bank account"),
})

export const AddBankAccountSchema = z.object({
  bank_name: z.string().min(2, "Bank name must be at least 2 characters"),
  account_name: z.string().min(2, "Account name must be at least 2 characters"),
  account_number: z
    .string()
    .min(6, "Account number must be at least 6 characters")
    .max(20, "Account number must be less than 20 characters")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
})

export const TradeSchema = z.object({
  amount: z
    .number()
    .min(10, "Minimum trade amount is $10")
    .max(100000, "Maximum trade amount is $100,000")
    .positive("Amount must be positive"),
  leverage: z.number().min(1, "Minimum leverage is 1x").max(100, "Maximum leverage is 100x").int(),
  asset_id: z.string().uuid("Invalid asset ID"),
  order_type: z.enum(["buy", "sell"]),
})

export type DepositInput = z.infer<typeof DepositSchema>
export type WithdrawalInput = z.infer<typeof WithdrawalSchema>
export type AddBankAccountInput = z.infer<typeof AddBankAccountSchema>
export type TradeInput = z.infer<typeof TradeSchema>
