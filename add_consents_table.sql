-- Create consents table
CREATE TABLE public.consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL,
  consent_version text NOT NULL,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now()
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own consent" ON public.consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own consent" ON public.consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON public.consents
  FOR SELECT USING (public.is_admin());

-- Setup Storage Policies for 'items' bucket
-- Note: 'items' bucket was created in previous script, ensure policies exist
-- Allow authenticated users to upload images to items/
CREATE POLICY "Users can upload item images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'items' AND auth.role() = 'authenticated'
  );

-- Anyone can view item images
CREATE POLICY "Anyone can view item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'items');

-- Donors can update/delete their own images
CREATE POLICY "Donors can update their item images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'items' AND auth.uid() = owner
  );

CREATE POLICY "Donors can delete their item images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'items' AND auth.uid() = owner
  );
