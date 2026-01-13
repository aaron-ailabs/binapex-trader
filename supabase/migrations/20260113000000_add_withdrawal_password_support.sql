-- Migration: Add Withdrawal Password Support
-- Created: 2026-01-13
-- Purpose: Add secure storage for user withdrawal passwords

-- Create user_withdrawal_secrets table
CREATE TABLE IF NOT EXISTS public.user_withdrawal_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_withdrawal_secret UNIQUE(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_withdrawal_secrets_user_id
ON public.user_withdrawal_secrets(user_id);

-- Enable RLS
ALTER TABLE public.user_withdrawal_secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_withdrawal_secrets

-- Users can only view their own withdrawal secret
CREATE POLICY "Users can view own withdrawal secret"
ON public.user_withdrawal_secrets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own withdrawal secret (during signup)
CREATE POLICY "Users can insert own withdrawal secret"
ON public.user_withdrawal_secrets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own withdrawal secret
CREATE POLICY "Users can update own withdrawal secret"
ON public.user_withdrawal_secrets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawal secrets (for support, but cannot see plaintext)
CREATE POLICY "Admins can view all withdrawal secrets"
ON public.user_withdrawal_secrets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add columns to profiles table to track withdrawal password status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS withdrawal_password_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS withdrawal_password_last_reset TIMESTAMPTZ;

-- Create function to update withdrawal password timestamp
CREATE OR REPLACE FUNCTION update_withdrawal_password_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profiles table to reflect withdrawal password is set
  UPDATE public.profiles
  SET
    withdrawal_password_set = true,
    withdrawal_password_last_reset = NEW.updated_at
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update profiles when withdrawal password changes
DROP TRIGGER IF EXISTS tr_update_withdrawal_password_timestamp ON public.user_withdrawal_secrets;
CREATE TRIGGER tr_update_withdrawal_password_timestamp
AFTER INSERT OR UPDATE ON public.user_withdrawal_secrets
FOR EACH ROW
EXECUTE FUNCTION update_withdrawal_password_timestamp();

-- Add comment for documentation
COMMENT ON TABLE public.user_withdrawal_secrets IS 'Stores hashed withdrawal passwords separately from login passwords for enhanced security';
COMMENT ON COLUMN public.user_withdrawal_secrets.password_hash IS 'Bcrypt hash of withdrawal password (cost factor 10)';
COMMENT ON COLUMN public.profiles.withdrawal_password_set IS 'Indicates if user has set a withdrawal password';
COMMENT ON COLUMN public.profiles.withdrawal_password_last_reset IS 'Timestamp of last withdrawal password change';
