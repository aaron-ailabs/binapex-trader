-- Migration: Fix Wallets Schema for Signup
-- Created: 2026-01-13
-- Purpose: Ensure wallets table has required columns for signup trigger

-- Add asset_type column if it doesn't exist
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) DEFAULT 'fiat';

-- Add comment for clarity
COMMENT ON COLUMN public.wallets.asset_type IS 'Type of asset: fiat, crypto, stock, etc.';

-- Ensure wallets table has the correct structure
-- This migration ensures compatibility with the handle_new_user trigger
