-- Completely reset and fix all RLS policies on profiles table

-- 1. Drop ALL existing policies cleanly
DROP POLICY IF EXISTS "Profile full access for users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

-- 2. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Any authenticated user can read their OWN profile row
CREATE POLICY "read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Any authenticated user can update their OWN profile row
CREATE POLICY "update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Any authenticated user can insert their OWN profile row
CREATE POLICY "insert_own_profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6. Super admins and verification/support admins can read ALL profiles
CREATE POLICY "admins_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.admin_role IN ('super_admin', 'verification_admin', 'support_moderator')
    )
  );

-- 7. Super admins can update ANY profile (for account approvals)
CREATE POLICY "super_admin_update_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.admin_role = 'super_admin'
    )
  );
