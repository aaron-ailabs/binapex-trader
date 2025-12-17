# How to Run SQL Migrations in Binapex

## Problem
SQL scripts in the `/scripts` folder are **reference files only** and cannot be executed directly in v0's preview environment.

## Solution
Use the integrated Supabase tools to apply migrations directly to your connected Supabase database.

## Methods

### Method 1: Use v0's Integrated Supabase Tool (Recommended)
I can run migrations for you using the `supabase_apply_migration` command. Just ask me to:
- "Run migration 001_create_profiles"
- "Apply the core tables migration"
- "Execute all pending migrations"

### Method 2: Supabase Dashboard SQL Editor
1. Open your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents from the script file (e.g., `scripts/001_create_profiles.sql`)
5. Paste into the SQL editor
6. Click **Run** to execute

### Method 3: Supabase CLI (Advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run a specific migration
supabase db push

# Or execute SQL directly
supabase db execute --file scripts/001_create_profiles.sql
```

## Current Migrations Status

| Script | Purpose | Status |
|--------|---------|--------|
| `001_create_profiles.sql` | User profiles with RLS | ✅ Applied |
| `002_create_core_tables.sql` | Assets, banks, transactions, trades | ⏳ Pending |
| `003_seed_initial_data.sql` | Sample assets and bank accounts | ⏳ Pending |
| `004_market_prices_and_orders.sql` | Price tracking and orders | ⏳ Pending |
| `005_trade_execution_function.sql` | Trade execution logic | ⏳ Pending |
| `006_security_audit.sql` | RLS verification | ⏳ Pending |
| `007_create_admin_user.sql` | Admin user setup | ⏳ Pending |

## Next Steps
Ask me to run the pending migrations, and I'll apply them to your Supabase database using the integrated tools!
