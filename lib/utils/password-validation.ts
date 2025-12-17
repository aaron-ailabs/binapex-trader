import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

// Common passwords to reject
const COMMON_PASSWORDS = [
  "password",
  "password123",
  "12345678",
  "qwerty123",
  "abc123456",
  "password1",
  "123456789",
  "111111111",
  "admin123",
  "letmein",
]

export function isPasswordCommon(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase())
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  try {
    passwordSchema.parse(password)
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map((e) => e.message))
    }
  }

  if (isPasswordCommon(password)) {
    errors.push("This password is too common. Please choose a stronger password.")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function getPasswordStrength(password: string): {
  score: number // 0-4
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong"
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (isPasswordCommon(password)) {
    score = Math.max(0, score - 2)
  }

  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"] as const
  const colors = ["#dc2626", "#f59e0b", "#eab308", "#22c55e", "#16a34a"]

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
  }
}
