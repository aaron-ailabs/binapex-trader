-- Add credit_score column to profiles table
-- Null-first logic: credit_score is NULL for new users until rated
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credit_score INTEGER,
ADD COLUMN IF NOT EXISTS credit_score_updated_at TIMESTAMPTZ;

-- Index for efficient sorting (null values appear first in descending order)
CREATE INDEX IF NOT EXISTS idx_profiles_credit_score ON public.profiles(credit_score DESC NULLS FIRST);

-- Add credit history table for audit trail
CREATE TABLE IF NOT EXISTS public.credit_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  reason VARCHAR(255),
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying of user's credit history
CREATE INDEX IF NOT EXISTS idx_credit_score_history_user_id ON public.credit_score_history(user_id, created_at DESC);
