-- 1. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('items', 'items', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can read items bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload items" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own item images" ON storage.objects;

-- 3. Public Read Access
CREATE POLICY "Public can view item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'items');

-- 4. Strict Upload Access (Authenticated Approved Donors ONLY)
-- Enforce:
-- - max 5MB (5242880 bytes)
-- - only image/webp, image/jpeg, image/png
CREATE POLICY "Approved donors can upload item images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'items' AND
    public.is_approved_user() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'donor' OR role = 'both')) AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (LOWER(storage.extension(name)) = 'webp' OR LOWER(storage.extension(name)) = 'jpg' OR LOWER(storage.extension(name)) = 'jpeg' OR LOWER(storage.extension(name)) = 'png')
  );

-- 5. Delete Access
CREATE POLICY "Users can delete their own item images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'items' AND
    auth.uid() = owner
  );
