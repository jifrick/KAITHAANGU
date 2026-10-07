ALTER TABLE public.recipient_verifications ADD COLUMN applicant_reason text;

-- Drop existing policies on recipient_verifications to refine them for the new admin matrix
DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.recipient_verifications;
DROP POLICY IF EXISTS "Users can view their own verification" ON public.recipient_verifications;
DROP POLICY IF EXISTS "Users can insert their own verification" ON public.recipient_verifications;

CREATE POLICY "Users can view their own verification" ON public.recipient_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification" ON public.recipient_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Super Admin and Verification Admin can manage verifications
CREATE POLICY "Verification Admins can manage verifications" ON public.recipient_verifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND (admin_role = 'super_admin' OR admin_role = 'verification_admin')
    )
  );

-- We also need to update profiles RLS to ensure Verification Admins can see the recipient's phone and address
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Super Admin can manage all profiles
-- Verification Admin can manage recipient profiles
-- Support Moderator can manage basic profiles
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role = 'admin' 
      AND (p2.admin_role = 'super_admin' OR p2.admin_role = 'verification_admin' OR p2.admin_role = 'support_moderator')
    )
  );
