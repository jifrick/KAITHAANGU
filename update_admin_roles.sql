CREATE TYPE admin_type AS ENUM ('super_admin', 'verification_admin', 'content_admin', 'matching_admin', 'support_moderator');

ALTER TABLE public.profiles ADD COLUMN admin_role admin_type;

-- Update the items RLS to restrict who can moderate items
-- First, drop the old admin policy for items
DROP POLICY IF EXISTS "Admins can manage all items" ON public.items;

-- Recreate policy: Content Admins and Super Admins can manage all items
CREATE POLICY "Content and Super Admins can manage items" ON public.items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND (admin_role = 'super_admin' OR admin_role = 'content_admin')
    )
  );

-- Matching Admins can view published and pending items for matching purposes
CREATE POLICY "Matching Admins can view items" ON public.items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND (admin_role = 'matching_admin')
    )
  );

-- Update the matches RLS
DROP POLICY IF EXISTS "Admins can manage all matches" ON public.matches;

CREATE POLICY "Matching and Super Admins can manage matches" ON public.matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND (admin_role = 'super_admin' OR admin_role = 'matching_admin')
    )
  );
