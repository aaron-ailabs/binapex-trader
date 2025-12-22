-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'admin')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own messages
CREATE POLICY "Users can view own messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON public.support_messages
  FOR ALL USING (public.is_admin());

-- Realtime
-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
