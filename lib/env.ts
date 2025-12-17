/**
 * Environment Variable Validation
 *
 * This file validates all required environment variables at build/runtime
 * to prevent configuration errors in production.
 */

import { z } from "zod"

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database
  POSTGRES_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),

  // AlphaVantage (server-side only)
  ALPHAVANTAGE_API_KEY: z.string().min(1),

  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: z.string().min(1),

  // Tawk.to (optional)
  NEXT_PUBLIC_TAWK_PROPERTY_ID: z.string().optional(),
  NEXT_PUBLIC_TAWK_WIDGET_ID: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]),
})

// Validate environment variables
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    return { success: true, env }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join("."))
      console.error("❌ Invalid environment variables:", missingVars)
      throw new Error(`Missing or invalid environment variables: ${missingVars.join(", ")}`)
    }
    throw error
  }
}

// Export validated env vars (call this at app startup)
export const env = validateEnv().env

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === "production"
export const isDevelopment = env.NODE_ENV === "development"
