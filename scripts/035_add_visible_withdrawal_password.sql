-- Migration: Add visible_withdrawal_password to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS visible_withdrawal_password TEXT;
