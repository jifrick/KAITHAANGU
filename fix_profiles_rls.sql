DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profile full access for users" ON public.profiles
FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
