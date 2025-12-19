-- Add RLS policies for the 'receipts' bucket

-- Allow authenticated users to upload to 'receipts' bucket
-- They can upload files under their own user ID folder
CREATE POLICY "Users can upload to receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own receipts in 'receipts' bucket
CREATE POLICY "Users can view own receipts in bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow admins to view all receipts in 'receipts' bucket
CREATE POLICY "Admins can view all receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Allow public access to receipts via public URL (if underlying bucket is public, this might not be strictly needed for getPublicUrl but good for direct access if needed)
-- Since we made the bucket public, we can also add a public read policy if we want to allow direct downloads without signed URLs
CREATE POLICY "Public read receipts" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'receipts');
