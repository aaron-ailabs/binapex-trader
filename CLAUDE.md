# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Binapex Trader** is a financial trading platform with dual interfaces: **BullVest** (fast trades) and **BearVest** (steady trades). It's a Next.js 16 application using Supabase for backend services (PostgreSQL, Auth, Realtime).

### Key Technologies
- **Frontend**: Next.js 16.1.1, React 19.2.0, TypeScript 5, Tailwind CSS 4.1.9
- **UI Components**: Shadcn/UI (New York style) with Radix UI primitives
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Validation**: Zod 3.25.76 with React Hook Form 7.60.0
- **Deployment**: Vercel (primary) + Docker (secondary)
- **Monitoring**: Sentry (@sentry/nextjs 8.55.0)

## Essential Commands

### Development
```bash
# Start development server (requires .env.local)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint with zero tolerance (max-warnings=0)
npm run lint

# Test settlement logic
npm run test:money
```

### Package Installation
**CRITICAL**: Always use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

### Supabase (Database & Edge Functions)
```bash
# Link to Supabase project
supabase link --project-ref <your-project-ref>

# Apply all migrations
supabase db push

# Create new migration
supabase migration new <migration-name>

# Deploy Edge Functions
supabase functions deploy <function-name>

# View function logs
supabase functions logs <function-name>
```

### Docker
```bash
# Build and run
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f
```

## Architecture Overview

### Project Structure
```
app/                          # Next.js App Router
├── api/                      # API route handlers
│   ├── market/               # Market data endpoints
│   ├── orders/               # Order management
│   └── trading/              # Trading endpoints
├── actions/                  # Server Actions
│   ├── trade.ts              # Trade execution
│   ├── banking.ts            # Banking operations
│   └── security.ts           # Security operations
├── (pages)/                  # Application pages
│   ├── dashboard/            # User dashboard
│   ├── trade/                # Trading interface
│   ├── deposit/              # Deposit funds
│   └── ...                   # Other pages
└── layout.tsx                # Root layout

components/                   # React components
├── ui/                       # Shadcn/UI components (50+)
├── trading/                  # Trading interface components
├── banking/                  # Banking components
└── support/                  # Support chat components

lib/                          # Core utilities
├── supabase/                 # Supabase clients
│   ├── client.ts             # Browser client (with RLS)
│   └── server.ts             # Server client (with user context)
├── schemas/                  # Zod validation schemas
├── market-data.ts            # Market data aggregation
└── utils.ts                  # Utility functions

hooks/                        # Custom React hooks
├── use-market-prices.ts      # Real-time price data
├── use-live-data.ts          # Live data subscriptions
└── use-user-portfolio.ts     # Portfolio data

supabase/
├── migrations/               # Database migrations (30+ files)
│   ├── 20240101000000_init_trade_schema.sql
│   ├── 20251218000001_security_hardening.sql
│   └── 99999999999999_consolidated_schema.sql
└── functions/                # Edge Functions (Deno)
    ├── market-data-cron/     # Price updates (every 10s)
    ├── execute-order/        # Order execution
    └── check-liquidations/   # Risk management

scripts/                      # Utility scripts
├── test-settlement.ts        # Settlement testing
└── test-db.js                # Database connectivity
```

### Data Flow Architecture

1. **Market Data**: Yahoo Finance API → `lib/market-data.ts` → API routes → Frontend hooks
2. **Trading**: Client → Server Action → Supabase RPC → Database → Realtime updates
3. **Authentication**: Supabase Auth → Middleware validation → Session management
4. **Authorization**: RLS policies on all tables → Role-based access (user/admin)

## Key Patterns & Conventions

### 1. Path Aliases (Required)
**ALWAYS** use path aliases instead of relative paths:
```typescript
// ✅ CORRECT
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { OpenTradeSchema } from "@/lib/schemas/trading"

// ❌ WRONG
import { Button } from "../../components/ui/button"
```

### 2. Supabase Client Types
Use the correct client based on context:

**Browser Client** (with RLS):
```typescript
"use client"
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
// RLS policies automatically filter to current user
```

**Server Client** (with user context):
```typescript
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
// Still respects RLS - user context from session
```

**Service Client** (bypasses RLS - ADMIN ONLY):
```typescript
import { createServiceClient } from "@/lib/supabase/service"
const supabase = createServiceClient()
// Bypasses RLS - use only for admin operations
```

### 3. Server Actions Pattern
Location: `/app/actions/*.ts`
```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function myAction(input: MyInput) {
  const supabase = await createClient()

  // 1. Validate input
  const validated = MySchema.parse(input)

  // 2. Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // 3. Execute business logic
  const { data, error } = await supabase.from("table").insert(validated)

  if (error) return { error: error.message }

  // 4. Revalidate affected paths
  revalidatePath("/dashboard")

  return { success: true, data }
}
```

### 4. API Routes Pattern
Location: `/app/api/*/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic" // Disable caching

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Your logic here
    const { data, error } = await supabase.from("table").select()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### 5. Validation Pattern
Location: `/lib/schemas/*.ts`
```typescript
import { z } from "zod"

export const MySchema = z.object({
  field1: z.string().email("Invalid email"),
  field2: z.number().positive("Must be positive"),
  field3: z.enum(["option1", "option2"]),
})

export type MyInput = z.infer<typeof MySchema>

// Usage in server action/API:
const validated = MySchema.parse(rawData) // Throws on invalid
// or
const result = MySchema.safeParse(rawData) // Returns { success, data, error }
```

## Database & Security

### Database Schema
- **30+ migrations** creating comprehensive trading platform schema
- **RLS (Row Level Security)** enabled on ALL tables
- **Key tables**: profiles, assets, wallets, trades, transactions, limit_orders
- **Stored procedures**: `execute_binary_trade()`, `create_order()`, `get_user_role()`

### Security Best Practices
- **Input Validation**: All user input validated with Zod
- **Password Hashing**: bcryptjs 2.4.3 for password hashing
- **RLS Policies**: All tables have Row Level Security enabled
- **Service Role**: Never expose SUPABASE_SERVICE_ROLE_KEY to client
- **Environment Variables**: Validated at startup via `lib/env-validation.ts`

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database
POSTGRES_URL=postgresql://...
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=postgres
POSTGRES_HOST=...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Market Data
ALPHAVANTAGE_API_KEY=...

# Optional
NEXT_PUBLIC_TAWK_PROPERTY_ID=...
NEXT_PUBLIC_TAWK_WIDGET_ID=...
NODE_ENV=development|production|test
```

## Common Tasks

### Add New Trading Asset
```sql
-- 1. Add to assets table
INSERT INTO public.assets (symbol, name, type, is_active)
VALUES ('SOL', 'Solana', 'crypto', true);

-- 2. Create trading pair
INSERT INTO public.trading_pairs (
  symbol, base_asset, quote_asset, asset_type,
  buy_fee_percentage, sell_fee_percentage, is_active
)
VALUES (
  'SOL-USD', 'SOL', 'USD', 'crypto',
  0.0060, 0.0110, true
);
```
No code changes needed - asset appears automatically.

### Add New Component
```bash
# Add Shadcn/UI component
npx shadcn@latest add button
npx shadcn@latest add card dialog
```

### Add New Supabase Migration
```bash
supabase migration new my_migration_name
# Edit the generated SQL file
supabase db push
```

## Important Notes

### ⚠️ Critical Rules
1. **NEVER modify** `package.json` dependencies without explicit approval
2. **ALWAYS use** `--legacy-peer-deps` when installing packages
3. **ALWAYS use** path aliases (`@/*`) instead of relative imports
4. **ALWAYS validate** user input with Zod schemas
5. **ALWAYS check** user authentication before sensitive operations
6. **NEVER bypass** RLS policies unless using service client for admin operations
7. **NEVER commit** environment variables or secrets

### 🎯 Best Practices
1. **Prefer Server Components** over Client Components when possible
2. **Use Server Actions** instead of API routes for mutations
3. **Use Zod** for all validation (client and server)
4. **Use TypeScript** strictly - no `any` types unless absolutely necessary
5. **Use Tailwind** utility classes instead of custom CSS
6. **Use Shadcn/UI** components instead of building from scratch
7. **Follow existing patterns** - consistency is key

### 🔍 Debugging Tips
```typescript
// Check user session
const { data: { user } } = await supabase.auth.getUser()

// Check user role
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single()

// Test database connection
const { data, error } = await supabase
  .from("profiles")
  .select("count")
```

### 📚 Key Documentation
- **Next.js 16**: https://nextjs.org/docs
- **React 19**: https://react.dev/
- **Supabase**: https://supabase.com/docs
- **Shadcn/UI**: https://ui.shadcn.com/
- **Zod**: https://zod.dev/

---

**Last Updated**: 2026-01-23
**Project Version**: 0.1.0
**Production URL**: https://www.binapex.my