-- Make receipts bucket public to allow Admin Dashboard to view them
UPDATE storage.buckets
SET public = true
WHERE id = 'receipts';

-- Ensure the update is reflected if it was inserted with conflict do nothing previously
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure policy allows public read if not already covered (though public=true usually handles the public url generation, direct select might need policy)
-- Existing policy was: CREATE POLICY "Users can read own receipts" ...
-- We need admins to read too.
-- The simplest way for public=true buckets is that they are publicly accessible via getPublicUrl without RLS checks on the SELECT if accessed via the public URL.
-- However, for good measure, let's keep it simple. The goal is to make getPublicUrl work.
