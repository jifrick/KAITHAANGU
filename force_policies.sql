-- Drop ALL existing policies on profiles to wipe the slate clean
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

-- Re-create the core policies extremely explicitly
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON public.profiles
FOR ALL USING (
  public.has_admin_role(ARRAY['super_admin', 'verification_admin', 'support_moderator'])
);

-- Ensure the trigger actually creates the row correctly without failing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Anonymous'), 'donor')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
