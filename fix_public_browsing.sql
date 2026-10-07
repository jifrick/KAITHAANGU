-- Drop the existing overly-restrictive policy
DROP POLICY IF EXISTS "Approved users can view items" ON public.items;
DROP POLICY IF EXISTS "Anyone can view items" ON public.items;
DROP POLICY IF EXISTS "Anyone can view published items" ON public.items;
DROP POLICY IF EXISTS "Approved or public users can view items" ON public.items;

-- Create a new policy that allows:
-- 1. Anonymous users to view published items
-- 2. Authenticated users to view published items ONLY IF they are approved
CREATE POLICY "Approved or public users can view items" ON public.items
  FOR SELECT USING (
    (status = 'published') AND 
    (auth.role() = 'anon' OR public.is_approved_user())
  );
