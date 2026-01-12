# CLAUDE.md - AI Assistant Guide for Binapex Trader

> **Last Updated**: 2026-01-12
> **Project**: Binapex Trader - Premium Trading Platform
> **Version**: 0.1.0
> **Primary URL**: https://www.binapex.my

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions & Patterns](#code-conventions--patterns)
6. [Database Schema & Migrations](#database-schema--migrations)
7. [API Routes & Server Actions](#api-routes--server-actions)
8. [Component Patterns](#component-patterns)
9. [Authentication & Authorization](#authentication--authorization)
10. [Testing Approach](#testing-approach)
11. [Deployment](#deployment)
12. [Common Tasks & Examples](#common-tasks--examples)
13. [Troubleshooting](#troubleshooting)
14. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Project Overview

**Binapex** is a sophisticated web-based financial trading platform that enables users to trade multiple asset classes including:
- **Cryptocurrencies** (BTC, ETH, etc.)
- **Forex pairs** (EUR/USD, GBP/USD, etc.)
- **Stocks** (major indices and individual stocks)
- **Commodities** (Gold, Silver, Oil, etc.)

### Key Features

- **Real-time market data** via Yahoo Finance API
- **Order execution engine** with market and limit orders
- **Trading timers** with configurable durations (30s to 1 hour)
- **TradingView-style charts** with technical analysis
- **Portfolio management** and real-time tracking
- **Banking system** with deposits and withdrawals
- **WhatsApp-style support chat** system
- **Membership tiers** (Bronze, Silver, Gold, Platinum)
- **Admin portal** for platform management
- **Premium black-gold theme** for professional UX

### Architecture Philosophy

Binapex follows a **Hybrid Monolith + Microservice** architecture:
- **Main Application**: Next.js 16 monolith with App Router
- **Market Data Service**: Python FastAPI microservice (separate scaling)
- **Backend-as-a-Service**: Supabase for database, auth, realtime, storage
- **Edge Functions**: Serverless functions for background jobs

---

## Architecture & Tech Stack

### Frontend Stack

```json
{
  "framework": "Next.js 16.0.10",
  "runtime": "React 19.2.0",
  "language": "TypeScript 5",
  "styling": "Tailwind CSS 4.1.9",
  "components": "Shadcn/UI (Radix UI primitives)",
  "animations": "Framer Motion 12.25.0",
  "icons": "Lucide React",
  "charts": "lightweight-charts 5.1.0 + Recharts 2.15.4"
}
```

### Backend Stack

```json
{
  "database": "PostgreSQL (via Supabase)",
  "auth": "@supabase/ssr 0.8.0 + @supabase/supabase-js 2.87.1",
  "realtime": "Supabase Realtime (WebSocket)",
  "storage": "Supabase Storage + Vercel Blob",
  "edge-functions": "Supabase Edge Functions (Deno)",
  "market-data": "Python FastAPI + Yahoo Finance"
}
```

### Data & Validation

```json
{
  "validation": "Zod 3.25.76",
  "forms": "React Hook Form 7.60.0",
  "date-utils": "date-fns 4.1.0"
}
```

### Monitoring & Infrastructure

```json
{
  "errors": "Sentry (@sentry/nextjs 10.32.1)",
  "analytics": "Vercel Analytics",
  "deployment": "Vercel (primary) + Docker (secondary)",
  "security": "bcrypt 6.0.0 for password hashing"
}
```

---

## Directory Structure

```
/home/user/binapex-trader/
│
├── app/                          # Next.js App Router (pages & API routes)
│   ├── api/                      # API route handlers
│   │   ├── market/               # Market data endpoints
│   │   │   ├── dashboard/        # All asset prices
│   │   │   ├── quote/            # Single asset quote
│   │   │   └── history/          # Historical data
│   │   ├── orders/               # Order management
│   │   │   └── [id]/cancel/      # Cancel specific order
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── withdrawals/          # Withdrawal operations
│   │   ├── cron/                 # Background jobs
│   │   └── upload-receipt/       # Receipt uploads
│   │
│   ├── actions/                  # Next.js Server Actions
│   │   ├── trade.ts              # Trade execution
│   │   ├── trades.ts             # Trade queries
│   │   ├── banking.ts            # Banking operations
│   │   ├── security.ts           # Security operations
│   │   ├── assets.ts             # Asset management
│   │   └── ...
│   │
│   ├── (pages)/                  # Application pages
│   │   ├── dashboard/            # User dashboard
│   │   ├── trade/                # Trading interface
│   │   ├── history/              # Trade history
│   │   ├── deposit/              # Deposit funds
│   │   ├── withdrawal/           # Withdraw funds
│   │   ├── settings/             # User settings
│   │   ├── support/              # Support chat
│   │   ├── membership/           # Membership tiers
│   │   ├── login/                # Login page
│   │   └── signup/               # Registration page
│   │
│   ├── layout.tsx                # Root layout (providers, fonts, analytics)
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles + Tailwind imports
│
├── components/                   # React components
│   ├── ui/                       # Base Shadcn/UI components (50+)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (accordion, alert, badge, etc.)
│   │
│   ├── auth/                     # Authentication components
│   ├── banking/                  # Banking & financial components
│   ├── dashboard/                # Dashboard widgets
│   ├── history/                  # Trade history components
│   ├── trading/                  # Trading interface components
│   ├── support/                  # Support system components
│   ├── landing/                  # Landing page sections
│   └── ...
│
├── lib/                          # Core utilities and services
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client (with RLS)
│   │   ├── server.ts             # Server client (with user context)
│   │   ├── proxy.ts              # Middleware session handler
│   │   └── service.ts            # Service role (bypasses RLS)
│   │
│   ├── schemas/                  # Zod validation schemas
│   │   ├── auth.ts               # Auth validation
│   │   ├── trading.ts            # Trade validation
│   │   ├── banking.ts            # Banking validation
│   │   └── admin.ts              # Admin validation
│   │
│   ├── services/                 # Business logic
│   │   ├── order-matching-engine.ts
│   │   └── strategy-engine.ts
│   │
│   ├── constants/                # Application constants
│   ├── hooks/                    # Reusable hooks
│   ├── middleware/               # Auth & rate limiting
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── env.ts                    # Environment variable exports
│   ├── env-validation.ts         # Environment schema validation
│   └── market-data.ts            # Market data aggregation
│
├── contexts/                     # React Context providers
│   └── auth-context.tsx          # Authentication state + role caching
│
├── hooks/                        # Custom React hooks
│   ├── use-market-prices.ts      # Real-time price data
│   ├── use-live-data.ts          # Live data subscriptions
│   ├── use-user-portfolio.ts     # Portfolio data
│   ├── use-sound-effects.ts      # Audio feedback
│   ├── useMarketData.ts          # Market data hook
│   └── use-toast.ts              # Toast notifications
│
├── supabase/                     # Supabase infrastructure
│   ├── migrations/               # Database migrations (29 files)
│   │   ├── 20240101000000_init_trade_schema.sql
│   │   ├── 20240101000001_seed_assets.sql
│   │   ├── 20251218000001_security_hardening.sql
│   │   ├── 99999999999999_consolidated_schema.sql
│   │   └── ...
│   │
│   └── functions/                # Edge Functions (Deno)
│       ├── market-data-cron/     # Price updates (every 10s)
│       ├── execute-order/        # Order execution
│       ├── check-liquidations/   # Risk management (every 30s)
│       ├── settle-trades/        # Trade settlement
│       ├── get-ticker/           # Live prices
│       ├── get-candles/          # Chart data
│       ├── place-order/          # Order placement
│       └── create-admin/         # Admin setup
│
├── market-service/               # Python FastAPI microservice
│   ├── main.py                   # FastAPI entry point
│   ├── market_data.py            # Yahoo Finance integration
│   └── requirements.txt          # Python dependencies
│
├── public/                       # Static assets
│   ├── sounds/                   # Audio files (trade sounds)
│   └── images/                   # Images and logos
│
├── scripts/                      # Utility scripts
│   ├── test-settlement.ts        # Settlement testing
│   ├── test-db.js                # Database connectivity
│   ├── verify-connectivity.ts    # Supabase connection
│   └── ...
│
├── types/                        # Global TypeScript types
│
├── styles/                       # Global styles
│
├── docs/                         # Documentation
│
├── middleware.ts                 # Next.js middleware (auth + redirects)
├── instrumentation.ts            # Sentry initialization
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── components.json               # Shadcn/UI configuration
├── vercel.json                   # Vercel deployment config
├── Dockerfile                    # Docker containerization
├── docker-compose.yml            # Docker orchestration
├── package.json                  # Dependencies and scripts
├── README.md                     # Project readme
├── DEPLOYMENT.md                 # Deployment guide
└── CLAUDE.md                     # This file (AI assistant guide)
```

---

## Development Workflows

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd binapex-trader

# 2. Install dependencies (IMPORTANT: use --legacy-peer-deps)
npm install --legacy-peer-deps

# 3. Set up environment variables
# Copy .env.example to .env.local and fill in:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - POSTGRES_URL (and related)
# - BLOB_READ_WRITE_TOKEN
# - ALPHAVANTAGE_API_KEY

# 4. Run development server
npm run dev
# Access: http://localhost:3000

# 5. Optional: Run Python market service
cd market-service
pip install -r requirements.txt
python main.py
# Access: http://localhost:8000
```

### Available Scripts

```json
{
  "dev": "next dev",           // Start development server
  "build": "next build",       // Build for production
  "start": "next start",       // Start production server
  "lint": "eslint --max-warnings=0",  // Lint with zero tolerance
  "test:money": "npx tsx scripts/test-settlement.ts"  // Test settlements
}
```

### Git Branch Strategy

**CRITICAL**: This project follows a specific branch naming convention:
- All development branches must start with `claude/`
- All branches must end with a session ID
- Example: `claude/add-feature-XyZ123`
- **Pushing to branches without this pattern will fail with 403**

Current development branch: `claude/add-claude-documentation-7CiD0`

### Environment Variables

**Required Variables** (validated via Zod schema):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (PostgreSQL)
POSTGRES_URL=postgresql://...
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=postgres
POSTGRES_HOST=...

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Market Data
ALPHAVANTAGE_API_KEY=...

# Optional
NEXT_PUBLIC_TAWK_PROPERTY_ID=...
NEXT_PUBLIC_TAWK_WIDGET_ID=...
NODE_ENV=development|production|test
```

**Environment Validation**: The app validates all required environment variables at startup using `lib/env-validation.ts`. If any are missing, the app will fail fast with a clear error message.

---

## Code Conventions & Patterns

### 1. File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `order-form.tsx`)
- **Server Actions**: `kebab-case.ts` (e.g., `trade.ts`)
- **API Routes**: `route.ts` (Next.js convention)
- **Schemas**: `kebab-case.ts` (e.g., `auth.ts`)
- **Types**: `kebab-case.ts` or `index.ts`
- **Utilities**: `kebab-case.ts`

### 2. Import Patterns

**ALWAYS use path aliases** (configured in `tsconfig.json`):

```typescript
// ✅ CORRECT - Use path aliases
import { Button } from "@/components/ui/button"
import { createSupabaseClient } from "@/lib/supabase/client"
import { OpenTradeSchema } from "@/lib/schemas/trading"

// ❌ WRONG - Don't use relative paths from root
import { Button } from "../../components/ui/button"
```

### 3. Component Patterns

#### Client Components

```typescript
"use client" // MUST be at the very top

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MyClientComponent() {
  const [state, setState] = useState()

  return (
    <div>
      <Button onClick={() => setState(...)}>Click Me</Button>
    </div>
  )
}
```

#### Server Components (Default)

```typescript
// NO "use client" directive needed

import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function MyServerComponent() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from("users").select()

  return <div>{/* render data */}</div>
}
```

### 4. Server Actions Pattern

**Location**: `/app/actions/*.ts`

```typescript
"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { OpenTradeSchema } from "@/lib/schemas/trading"
import { revalidatePath } from "next/cache"

export async function openTrade(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  // 1. Validate input
  const validated = OpenTradeSchema.parse({
    asset_id: formData.get("asset_id"),
    type: formData.get("type"),
    size: Number(formData.get("size")),
    leverage: Number(formData.get("leverage")),
    entry_price: Number(formData.get("entry_price")),
  })

  // 2. Execute business logic
  const { data, error } = await supabase
    .from("trades")
    .insert(validated)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 3. Revalidate affected paths
  revalidatePath("/dashboard")
  revalidatePath("/history")

  return { success: true, data }
}
```

### 5. API Route Pattern

**Location**: `/app/api/*/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic" // Disable caching

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol")

    // Fetch data
    const { data, error } = await supabase
      .from("assets")
      .select()
      .eq("symbol", symbol)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Similar pattern for POST requests
}
```

### 6. Database Query Patterns

#### Browser Client (with RLS)

```typescript
"use client"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function useUserData() {
  const supabase = createSupabaseBrowserClient()

  // RLS policies automatically filter to current user
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false })
}
```

#### Server Client (with user context)

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getUserTrades() {
  const supabase = await createSupabaseServerClient()

  // Still respects RLS - user context from session
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false })

  return data
}
```

#### Service Client (bypasses RLS - ADMIN ONLY)

```typescript
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export async function getAllTradesAdmin() {
  const supabase = createSupabaseServiceClient()

  // Bypasses RLS - sees ALL data regardless of user
  // ONLY use for admin operations
  const { data } = await supabase
    .from("trades")
    .select("*")

  return data
}
```

### 7. Validation Pattern (Zod)

**Location**: `/lib/schemas/*.ts`

```typescript
import { z } from "zod"

// 1. Define schema
export const OpenTradeSchema = z.object({
  asset_id: z.string().uuid("Invalid asset ID"),
  type: z.enum(["long", "short"]),
  size: z.number().positive("Size must be positive"),
  leverage: z.number().int().min(1).max(100),
  entry_price: z.number().positive("Entry price must be positive"),
})

// 2. Export TypeScript type
export type OpenTradeInput = z.infer<typeof OpenTradeSchema>

// 3. Use in server action or API route
const validated = OpenTradeSchema.parse(rawData) // Throws on invalid
// or
const result = OpenTradeSchema.safeParse(rawData) // Returns { success, data, error }
```

### 8. Error Handling Pattern

```typescript
"use server"

import { toast } from "sonner"

export async function performAction() {
  try {
    // Business logic
    const result = await doSomething()

    return { success: true, data: result }
  } catch (error) {
    console.error("Error in performAction:", error)

    // Return user-friendly error
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred"
    }
  }
}

// In client component:
"use client"

async function handleSubmit() {
  const result = await performAction()

  if (result.success) {
    toast.success("Action completed successfully")
  } else {
    toast.error(result.error)
  }
}
```

### 9. Styling Conventions

**Theme Colors** (Black-Gold Premium Theme):

```css
/* globals.css */
:root {
  --background: 10 10% 4%;        /* #0a0a0a - Deep black */
  --foreground: 48 96% 89%;       /* #EBD062 - Premium gold */
  --card: 0 0% 7%;                /* #121212 - Card background */
  --primary: 48 96% 53%;          /* #EBD062 - Gold */
  --secondary: 43 13% 90%;        /* Light gold/cream */
  /* ... more color variables */
}
```

**Tailwind Usage**:

```tsx
// ✅ CORRECT - Use Tailwind utility classes
<div className="bg-background text-foreground border border-primary/20">
  <h1 className="text-2xl font-bold text-primary">Binapex</h1>
</div>

// ✅ CORRECT - Use cn() for conditional classes
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "gold" && "gold-variant-classes"
)}>
```

### 10. Security Best Practices

#### Password Hashing

```typescript
import bcrypt from "bcrypt"

// Hash password (registration)
const hashedPassword = await bcrypt.hash(plainPassword, 10)

// Verify password (login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword)
```

#### Input Validation

```typescript
// ALWAYS validate user input with Zod
const validated = Schema.parse(userInput) // Throws on invalid

// Check authorization
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return { error: "Unauthorized" }
}

// Verify ownership
const { data: trade } = await supabase
  .from("trades")
  .select()
  .eq("id", tradeId)
  .eq("user_id", user.id) // Ensure user owns this trade
  .single()
```

#### Rate Limiting

```typescript
// Use middleware for rate limiting (lib/middleware/rate-limit.ts)
// Applied in API routes that need protection
```

---

## Database Schema & Migrations

### Schema Overview

The database consists of **29 migrations** creating a comprehensive trading platform schema. Key tables:

#### Core Tables

1. **profiles** - User profiles with KYC, balance, membership tier
2. **assets** - Tradable assets (crypto, forex, stocks, commodities)
3. **wallets** - Multi-asset wallet balances per user
4. **trading_pairs** - Tradable pairs (e.g., BTC-USD)
5. **limit_orders** - Order book entries
6. **executed_trades** - Matched trades
7. **trades** - User trade positions
8. **transactions** - Financial transactions (deposits, withdrawals)
9. **support_messages** - Support ticket messages
10. **admin_notifications** - Admin alerts
11. **unified_audit** - Audit trail for compliance

#### Key Constraints

- **RLS (Row Level Security)** enabled on ALL tables
- **Foreign keys** with CASCADE delete
- **CHECK constraints** for data integrity
- **UNIQUE constraints** on critical fields
- **Generated columns** for calculated fields

### Migration Workflow

```bash
# Link to Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Create new migration
supabase migration new migration_name

# Reset database (DANGER - deletes all data)
supabase db reset
```

### Important Migrations

1. **`99999999999999_consolidated_schema.sql`** - Complete schema reference
2. **`20251218000001_security_hardening.sql`** - RLS policies
3. **`20240101000001_seed_assets.sql`** - Initial asset seeding
4. **`20260103045000_unified_audit.sql`** - Audit logging

### Database Functions (RPC)

Key stored procedures:

```sql
-- Execute trade (atomic operation)
SELECT execute_trade(
  p_user_id UUID,
  p_asset_id UUID,
  p_type VARCHAR,
  p_size DECIMAL,
  p_leverage INTEGER,
  p_entry_price DECIMAL
)

-- Create order
SELECT create_order(
  p_user_id UUID,
  p_trading_pair_id UUID,
  p_side VARCHAR,
  p_type VARCHAR,
  p_price DECIMAL,
  p_amount DECIMAL
)

-- Get user role
SELECT get_user_role(p_user_id UUID)
```

---

## API Routes & Server Actions

### API Routes Structure

```
/app/api/
├── market/
│   ├── dashboard/route.ts      # GET - All asset prices
│   ├── quote/route.ts          # GET - Single asset quote (?symbol=BTC)
│   └── history/route.ts        # GET - Historical data
│
├── orders/
│   ├── route.ts                # GET/POST - List/create orders
│   └── [id]/cancel/route.ts    # POST - Cancel order
│
├── auth/
│   └── signup/route.ts         # POST - User registration
│
├── withdrawals/
│   └── verify-password/route.ts # POST - Verify withdrawal password
│
├── upload-receipt/route.ts     # POST - Upload deposit receipt
│
├── chart-data/route.ts         # GET - Chart OHLCV data
│
└── cron/
    └── auto-trade/route.ts     # POST - Automated trading (cron job)
```

### Server Actions

**Location**: `/app/actions/*.ts`

```typescript
// app/actions/trade.ts
export async function openTrade(input: OpenTradeInput)
export async function closeTrade(tradeId: string)

// app/actions/trades.ts
export async function getUserTrades()
export async function getTradeById(id: string)

// app/actions/banking.ts
export async function createDeposit(amount: number, method: string)
export async function createWithdrawal(amount: number, bank: string)

// app/actions/assets.ts
export async function getActiveAssets()
export async function getAssetById(id: string)

// app/actions/security.ts
export async function verifyWithdrawalPassword(password: string)
export async function updateWithdrawalPassword(old: string, new: string)
```

### Calling Server Actions

```typescript
"use client"

import { openTrade } from "@/app/actions/trade"
import { toast } from "sonner"

export function TradeForm() {
  async function handleSubmit(formData: FormData) {
    const result = await openTrade({
      asset_id: formData.get("asset_id") as string,
      type: formData.get("type") as "long" | "short",
      size: Number(formData.get("size")),
      leverage: Number(formData.get("leverage")),
      entry_price: Number(formData.get("entry_price")),
    })

    if (result.success) {
      toast.success("Trade opened successfully")
    } else {
      toast.error(result.error)
    }
  }

  return <form action={handleSubmit}>...</form>
}
```

---

## Component Patterns

### Shadcn/UI Components

This project uses **Shadcn/UI** - components are **copied into** `/components/ui/` (not installed as npm package). To add new components:

```bash
# Add a new component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add card dialog dropdown-menu
```

**Configuration**: See `components.json` for Shadcn settings.

### Component Organization

```
components/
├── ui/                    # Base components (Shadcn/UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── [feature]/             # Feature-specific components
│   ├── trading/
│   │   ├── order-form.tsx
│   │   ├── chart-component.tsx
│   │   └── active-positions.tsx
│   │
│   ├── banking/
│   │   ├── deposit-form.tsx
│   │   └── withdrawal-form.tsx
│   │
│   └── support/
│       ├── chat-window.tsx
│       └── support-widget.tsx
│
└── layout/                # Layout components
    └── dashboard-layout.tsx
```

### Component Template

```typescript
"use client" // Only if using hooks or browser APIs

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MyComponentProps {
  title: string
  variant?: "default" | "gold"
  className?: string
  children?: React.ReactNode
}

export function MyComponent({
  title,
  variant = "default",
  className,
  children,
}: MyComponentProps) {
  const [state, setState] = useState()

  return (
    <Card className={cn("p-4", className)}>
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  )
}
```

### Common Component Patterns

#### 1. Form with React Hook Form + Zod

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { OpenTradeSchema } from "@/lib/schemas/trading"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TradeForm() {
  const form = useForm({
    resolver: zodResolver(OpenTradeSchema),
    defaultValues: {
      size: 0,
      leverage: 1,
    },
  })

  async function onSubmit(values: OpenTradeInput) {
    // Call server action
    const result = await openTrade(values)
    // Handle result
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

#### 2. Data Fetching with Realtime

```typescript
"use client"

import { useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function LivePrices() {
  const [prices, setPrices] = useState<any[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    // Initial fetch
    async function fetchPrices() {
      const { data } = await supabase
        .from("assets")
        .select("*")
      setPrices(data || [])
    }
    fetchPrices()

    // Subscribe to realtime updates
    const channel = supabase
      .channel("prices")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "assets",
        },
        (payload) => {
          setPrices((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? payload.new : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return <div>{/* render prices */}</div>
}
```

---

## Authentication & Authorization

### Auth Flow

1. **Sign Up**: `/app/signup/page.tsx` → Server Action → Supabase Auth
2. **Login**: `/app/login/page.tsx` → Server Action → Supabase Auth
3. **Session Management**: Middleware (`middleware.ts`) validates session on every request
4. **Role-Based Access**: `profiles.role` field (user, admin, moderator)

### Protected Routes

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Admin portal redirect
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect("https://admin.binapex.my/login", 301)
  }

  // Session validation
  return await updateSession(request)
}
```

### Role Checking

```typescript
"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function adminOnlyAction() {
  const supabase = await createSupabaseServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Forbidden - Admin only" }
  }

  // Proceed with admin action
}
```

### Authentication Context

```typescript
"use client"

import { useAuth } from "@/contexts/auth-context"

export function UserComponent() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Role: {profile?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

---

## Testing Approach

### Current Testing Status

**No automated test framework** is currently configured. Testing is done via:

1. **Manual testing** - UI and functionality testing
2. **Test scripts** - Utility scripts in `/scripts/` directory
3. **Build validation** - TypeScript compilation and ESLint

### Available Test Scripts

```bash
# Settlement logic testing
npm run test:money

# Database connectivity
node scripts/test-db.js

# Withdrawal logic
npx tsx scripts/test_withdrawal_logic.ts

# Supabase connection
npx tsx scripts/verify-connectivity.ts

# Schema validation
npx tsx scripts/verify_schema_qa.ts

# Admin access
npx tsx scripts/verify_admin_access.ts
```

### Recommended Testing Strategy (Future)

```bash
# Unit tests (Jest/Vitest)
npm install -D vitest @testing-library/react @testing-library/jest-dom

# E2E tests (Playwright)
npm install -D @playwright/test

# Component tests (React Testing Library)
# Already compatible with Vitest
```

---

## Deployment

### Vercel Deployment (Primary)

**Production URL**: https://www.binapex.my

#### Via GitHub (Automatic)

1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Push to `main` branch → automatic production deployment
4. Push to feature branch → automatic preview deployment

#### Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... (add all required env vars)
```

#### Vercel Configuration

See `vercel.json`:

```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Docker Deployment (Secondary)

```bash
# Build Docker image
docker-compose build

# Run container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down

# Access application
http://localhost:3000
```

### Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy market-data-cron
supabase functions deploy execute-order
supabase functions deploy check-liquidations

# View logs
supabase functions logs market-data-cron
```

### Database Migrations

```bash
# Apply all migrations
supabase db push

# Create new migration
supabase migration new my_new_migration

# View migration status
supabase migration list
```

---

## Common Tasks & Examples

### Task 1: Add a New Trading Asset

```sql
-- 1. Add to database (via Supabase dashboard or migration)
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

No code changes needed - asset will appear automatically.

### Task 2: Add a New API Endpoint

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Your logic here
    const { data, error } = await supabase
      .from("some_table")
      .select()

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

### Task 3: Add a New Server Action

```typescript
// app/actions/my-action.ts
"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const MySchema = z.object({
  field1: z.string(),
  field2: z.number(),
})

export async function myAction(input: z.infer<typeof MySchema>) {
  try {
    // Validate
    const validated = MySchema.parse(input)

    // Get Supabase client
    const supabase = await createSupabaseServerClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Execute logic
    const { data, error } = await supabase
      .from("my_table")
      .insert(validated)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error in myAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred"
    }
  }
}
```

### Task 4: Add a New Page

```typescript
// app/my-page/page.tsx
import { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { MyClientComponent } from "@/components/my-component"

export const metadata: Metadata = {
  title: "My Page | Binapex",
  description: "Description of my page",
}

export default async function MyPage() {
  // Fetch data server-side
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from("my_table").select()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-primary">My Page</h1>
      <MyClientComponent initialData={data} />
    </div>
  )
}
```

### Task 5: Add a New Validation Schema

```typescript
// lib/schemas/my-schema.ts
import { z } from "zod"

export const MySchema = z.object({
  email: z.string().email("Invalid email address"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["deposit", "withdrawal"]),
  metadata: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
  }).optional(),
})

export type MySchemaInput = z.infer<typeof MySchema>
```

### Task 6: Add a New Custom Hook

```typescript
// hooks/use-my-hook.ts
"use client"

import { useState, useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function useMyHook() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("my_table")
          .select()

        if (error) throw error

        setData(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Peer Dependency Conflicts

```bash
# ❌ ERROR: npm install fails with peer dependency errors
npm install

# ✅ SOLUTION: Use --legacy-peer-deps flag
npm install --legacy-peer-deps
```

#### 2. Supabase Client Errors

```typescript
// ❌ ERROR: "Cannot read properties of undefined"
const supabase = createSupabaseServerClient() // Missing await
await supabase.from("table").select()

// ✅ SOLUTION: Always await server client creation
const supabase = await createSupabaseServerClient()
await supabase.from("table").select()
```

#### 3. Environment Variables Not Loading

```bash
# ❌ ERROR: "Invalid environment variables"

# ✅ SOLUTION: Check environment variable names and values
# - In local dev: .env.local
# - In Vercel: Project Settings → Environment Variables
# - Ensure all required vars are set (see lib/env-validation.ts)
```

#### 4. RLS Policy Blocking Query

```typescript
// ❌ ERROR: "Row-level security policy violation"

// ✅ SOLUTION: Check RLS policies in Supabase dashboard
// - Database → Tables → [table_name] → RLS Policies
// - Ensure user has proper role/permissions
// - For admin operations, use service client (bypasses RLS)
```

#### 5. TypeScript Build Errors

```bash
# ❌ ERROR: Build fails with TypeScript errors

# ✅ SOLUTION: Check next.config.mjs
# Note: TypeScript errors are currently IGNORED in builds
# See: typescript.ignoreBuildErrors: true
# Fix TypeScript errors in development for better DX
```

#### 6. Git Push Fails with 403

```bash
# ❌ ERROR: git push fails with HTTP 403

# ✅ SOLUTION: Branch must follow naming convention
# Branch name MUST start with "claude/" and end with session ID
# Example: claude/add-feature-XyZ123
```

#### 7. API Route Returns 500

```typescript
// ❌ Common causes:
// - Missing environment variables
// - Database connection issues
// - Invalid query syntax
// - RLS policy blocking

// ✅ SOLUTION: Check logs
// - Vercel: Project → Logs
// - Local: Terminal output
// - Supabase: Dashboard → API logs
```

### Debugging Tips

```typescript
// Enable verbose logging
console.log("Debug:", { variable1, variable2 })

// Check user session
const { data: { user } } = await supabase.auth.getUser()
console.log("Current user:", user)

// Check user role
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single()
console.log("User role:", profile?.role)

// Test database connection
const { data, error } = await supabase
  .from("profiles")
  .select("count")
console.log("DB test:", { data, error })
```

---

## Important Notes for AI Assistants

### 🚨 Critical Rules

1. **NEVER modify** `package.json` dependencies without explicit approval
2. **ALWAYS use** `--legacy-peer-deps` when installing packages
3. **ALWAYS use** path aliases (`@/*`) instead of relative imports
4. **ALWAYS validate** user input with Zod schemas
5. **ALWAYS check** user authentication before sensitive operations
6. **ALWAYS use** proper Supabase client (browser vs server vs service)
7. **NEVER bypass** RLS policies unless using service client for admin operations
8. **ALWAYS follow** branch naming convention: `claude/*-sessionId`
9. **NEVER commit** environment variables or secrets
10. **ALWAYS test** changes before committing

### 🎯 Best Practices

1. **Prefer Server Components** over Client Components when possible
2. **Use Server Actions** instead of API routes for mutations
3. **Use Zod** for all validation (client and server)
4. **Use TypeScript** strictly - no `any` types unless absolutely necessary
5. **Use Tailwind** utility classes instead of custom CSS
6. **Use Shadcn/UI** components instead of building from scratch
7. **Follow existing patterns** - consistency is key
8. **Write descriptive commit messages** in present tense
9. **Test thoroughly** before creating pull requests
10. **Document complex logic** with inline comments

### 📝 Code Review Checklist

Before submitting code, verify:

- [ ] TypeScript types are correct (no `any`)
- [ ] Zod schemas validate all user input
- [ ] Authentication is checked for protected operations
- [ ] Proper Supabase client is used (browser/server/service)
- [ ] RLS policies are respected
- [ ] Error handling is implemented
- [ ] Loading states are shown to users
- [ ] Success/error messages are displayed (toast)
- [ ] Path aliases (`@/*`) are used
- [ ] Tailwind classes are used for styling
- [ ] Code follows existing patterns
- [ ] No console.logs in production code
- [ ] Environment variables are not hardcoded
- [ ] Comments explain complex logic
- [ ] Commit message is descriptive

### 🔍 When to Ask for Clarification

Ask the user before:

1. **Modifying database schema** - migrations are sensitive
2. **Changing authentication flow** - security implications
3. **Modifying payment/financial logic** - high-risk area
4. **Changing API contracts** - may break clients
5. **Altering RLS policies** - security implications
6. **Removing existing features** - may be in use
7. **Upgrading major dependencies** - breaking changes
8. **Modifying environment variables** - may affect production

### 🛠️ Useful Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Lint code
npm run test:money             # Test settlements

# Git (with branch naming convention)
git checkout -b claude/feature-name-sessionId
git add .
git commit -m "Add feature description"
git push -u origin claude/feature-name-sessionId

# Supabase
supabase link --project-ref <ref>
supabase db push               # Apply migrations
supabase functions deploy <name>
supabase functions logs <name>

# Vercel
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
vercel logs                    # View logs
vercel env add <VAR_NAME>      # Add environment variable

# Docker
docker-compose build           # Build image
docker-compose up -d           # Start container
docker-compose logs -f         # View logs
docker-compose down            # Stop container
```

### 📚 Key Documentation Links

- **Next.js 16**: https://nextjs.org/docs
- **React 19**: https://react.dev/
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/UI**: https://ui.shadcn.com/
- **Zod**: https://zod.dev/
- **React Hook Form**: https://react-hook-form.com/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Conclusion

This document provides a comprehensive guide for AI assistants working on the Binapex Trader project. It covers:

- ✅ Project architecture and tech stack
- ✅ Directory structure and file organization
- ✅ Development workflows and conventions
- ✅ Code patterns and best practices
- ✅ Database schema and migrations
- ✅ API routes and server actions
- ✅ Component patterns
- ✅ Authentication and authorization
- ✅ Testing approach
- ✅ Deployment procedures
- ✅ Common tasks and examples
- ✅ Troubleshooting guide

**Remember**: This is a financial trading platform with real user data and money. Always prioritize **security**, **data integrity**, and **user experience** in every change you make.

For questions or clarifications, refer to the existing codebase, documentation files (README.md, DEPLOYMENT.md), or ask the project maintainer.

---

**Generated by**: Claude Code (AI Assistant)
**Last Updated**: 2026-01-12
**Maintained by**: Binapex Development Team
