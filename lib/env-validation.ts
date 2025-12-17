import { z } from "zod"

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database
  POSTGRES_URL: z.string().url(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_HOST: z.string().min(1),

  // Blob Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1),

  // AlphaVantage
  ALPHAVANTAGE_API_KEY: z.string().min(1),

  // Optional: Tawk.to (not required for core functionality)
  NEXT_PUBLIC_TAWK_PROPERTY_ID: z.string().optional(),
  NEXT_PUBLIC_TAWK_WIDGET_ID: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  console.error("❌ Invalid environment variables:")
  console.error(error)
  throw new Error("Invalid environment variables. Please check your .env file.")
}

export { env }
