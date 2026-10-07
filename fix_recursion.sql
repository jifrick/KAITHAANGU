CREATE OR REPLACE FUNCTION public.has_admin_role(required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND admin_role::text = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Admins can manage profiles" ON public.profiles
    FOR ALL USING (
      public.has_admin_role(ARRAY['super_admin', 'verification_admin', 'support_moderator'])
    );
