-- Create storage bucket for chat attachments (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for chat-attachments

-- Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid() = owner 
);

-- Allow users to view/download their own files
DROP POLICY IF EXISTS "Users can view their own chat attachments" ON storage.objects;
CREATE POLICY "Users can view their own chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND (auth.uid() = owner)
);

-- Allow admins to view/download all files
DROP POLICY IF EXISTS "Admins can view all chat attachments" ON storage.objects;
CREATE POLICY "Admins can view all chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND public.is_admin()
);

-- Add columns to support_messages if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_messages' AND column_name = 'attachment_url') THEN
        ALTER TABLE public.support_messages ADD COLUMN attachment_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_messages' AND column_name = 'attachment_type') THEN
        ALTER TABLE public.support_messages ADD COLUMN attachment_type TEXT;
    END IF;
END $$;
