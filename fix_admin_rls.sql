-- Fix: Allow the admin account to read its own profile
-- The admin user was created directly via Postgres INSERT so RLS needs
-- an explicit policy that covers it.

-- First, let's see what policies exist
-- Then add a permissive admin self-read policy

-- Drop old catch-all if exists, recreate cleanly
DROP POLICY IF EXISTS "Profile full access for users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Allow any authenticated user to read their OWN profile row
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow any authenticated user to update their OWN profile row
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow any authenticated user to insert their OWN profile row
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
