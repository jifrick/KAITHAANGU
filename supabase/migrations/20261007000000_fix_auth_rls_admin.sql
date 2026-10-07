-- Migration: 20261007000000_fix_auth_rls_admin.sql
-- Description: Complete fix for profile RLS recursion, admin authentication, reports policies, and security hardening.

BEGIN;

--------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS (WITH FIXED SEARCH_PATH)
--------------------------------------------------------------------------------

-- Helper: Check if calling user has an authorized admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
    AND (
      admin_role::text = ANY(required_roles)
      OR admin_role = 'super_admin'
    )
  );
END;
$$;

-- Helper: Check if calling user is any admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  );
END;
$$;

-- Helper: Check if calling user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
    AND admin_role = 'super_admin'
  );
END;
$$;

-- Helper: Check if calling user is an approved account
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND account_status = 'approved'
  );
END;
$$;

-- Restrict helper function execution
REVOKE EXECUTE ON FUNCTION public.has_admin_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_admin_role(text[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_approved_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_user() TO authenticated;


--------------------------------------------------------------------------------
-- 2. SENSITIVE PROFILE UPDATE TRIGGER HARDENING
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If caller is authorized admin (super_admin or verification_admin), allow modification
  IF public.has_admin_role(ARRAY['super_admin', 'verification_admin']) THEN
    RETURN NEW;
  END IF;

  -- Otherwise, normal user updating their own profile:
  -- Lock sensitive administrative fields
  NEW.account_status = OLD.account_status;
  NEW.admin_role = OLD.admin_role;

  -- Cannot change role once profile_completed is true
  IF OLD.profile_completed = true THEN
    NEW.role = OLD.role;
  END IF;

  RETURN NEW;
END;
$$;


--------------------------------------------------------------------------------
-- 3. PROFILES TABLE RLS POLICIES (ELIMINATES RLS RECURSION)
--------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile full access for users" ON public.profiles;

-- 1) Users read own profile
CREATE POLICY "read_own_profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- 2) Admins read all profiles (uses SECURITY DEFINER is_admin(), non-recursive)
CREATE POLICY "admins_read_all_profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 3) Insert own profile
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- 4) Update own profile (sensitive fields guarded by trigger)
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 5) Admins update profiles (account approvals & role management)
CREATE POLICY "admins_update_profiles" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'verification_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'verification_admin']));


--------------------------------------------------------------------------------
-- 4. REPORTS TABLE RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own_reports" ON public.reports;
DROP POLICY IF EXISTS "reporters_read_own_reports" ON public.reports;
DROP POLICY IF EXISTS "moderators_read_reports" ON public.reports;
DROP POLICY IF EXISTS "moderators_update_reports" ON public.reports;

-- 1) Signed-in users create reports as themselves
CREATE POLICY "users_insert_own_reports" ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

-- 2) Reporters can read their own reports
CREATE POLICY "reporters_read_own_reports" ON public.reports
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = reporter_id);

-- 3) Moderators & Admins read all reports
CREATE POLICY "moderators_read_reports" ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'support_moderator', 'content_admin']));

-- 4) Moderators & Admins resolve/update reports
CREATE POLICY "moderators_update_reports" ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'support_moderator', 'content_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'support_moderator', 'content_admin']));


--------------------------------------------------------------------------------
-- 5. RECIPIENT VERIFICATIONS RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.recipient_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_verification" ON public.recipient_verifications;
DROP POLICY IF EXISTS "Users can view their own verification" ON public.recipient_verifications;
DROP POLICY IF EXISTS "users_insert_own_verification" ON public.recipient_verifications;
DROP POLICY IF EXISTS "Users can insert their own verification" ON public.recipient_verifications;
DROP POLICY IF EXISTS "verification_admins_read_verifications" ON public.recipient_verifications;
DROP POLICY IF EXISTS "verification_admins_update_verifications" ON public.recipient_verifications;
DROP POLICY IF EXISTS "Verification Admins can manage verifications" ON public.recipient_verifications;

CREATE POLICY "users_read_own_verification" ON public.recipient_verifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "verification_admins_read_verifications" ON public.recipient_verifications
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'verification_admin']));

CREATE POLICY "users_insert_own_verification" ON public.recipient_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "verification_admins_update_verifications" ON public.recipient_verifications
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'verification_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'verification_admin']));


--------------------------------------------------------------------------------
-- 6. ITEMS RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_view_items" ON public.items;
DROP POLICY IF EXISTS "Approved or public users can view items" ON public.items;
DROP POLICY IF EXISTS "donors_view_own_items" ON public.items;
DROP POLICY IF EXISTS "Donors can manage their own items" ON public.items;
DROP POLICY IF EXISTS "admins_view_all_items" ON public.items;
DROP POLICY IF EXISTS "Matching Admins can view items" ON public.items;
DROP POLICY IF EXISTS "Content and Super Admins can manage items" ON public.items;
DROP POLICY IF EXISTS "approved_donors_insert_items" ON public.items;
DROP POLICY IF EXISTS "Approved donors can insert items" ON public.items;
DROP POLICY IF EXISTS "donors_update_own_items" ON public.items;
DROP POLICY IF EXISTS "Approved donors can update their own items" ON public.items;
DROP POLICY IF EXISTS "admins_update_items" ON public.items;

-- 1) Anyone can view published items
CREATE POLICY "public_view_items" ON public.items
  FOR SELECT
  TO public
  USING (status = 'published');

-- 2) Donors view their own items (any status)
CREATE POLICY "donors_view_own_items" ON public.items
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = donor_id);

-- 3) Admins view all items
CREATE POLICY "admins_view_all_items" ON public.items
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'content_admin', 'matching_admin', 'support_moderator']));

-- 4) Approved donors insert items
CREATE POLICY "approved_donors_insert_items" ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = donor_id AND public.is_approved_user());

-- 5) Donors update own items
CREATE POLICY "donors_update_own_items" ON public.items
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = donor_id)
  WITH CHECK ((SELECT auth.uid()) = donor_id);

-- 6) Admins update/moderate items
CREATE POLICY "admins_update_items" ON public.items
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'content_admin', 'matching_admin', 'support_moderator']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'content_admin', 'matching_admin', 'support_moderator']));


--------------------------------------------------------------------------------
-- 7. ITEM REQUESTS RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipients_view_own_requests" ON public.item_requests;
DROP POLICY IF EXISTS "donors_view_requests_for_own_items" ON public.item_requests;
DROP POLICY IF EXISTS "admins_view_item_requests" ON public.item_requests;
DROP POLICY IF EXISTS "approved_recipients_insert_requests" ON public.item_requests;
DROP POLICY IF EXISTS "recipients_cancel_own_requests" ON public.item_requests;
DROP POLICY IF EXISTS "admins_update_item_requests" ON public.item_requests;

CREATE POLICY "recipients_view_own_requests" ON public.item_requests
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_id);

CREATE POLICY "donors_view_requests_for_own_items" ON public.item_requests
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_id AND items.donor_id = (SELECT auth.uid())
  ));

CREATE POLICY "admins_view_item_requests" ON public.item_requests
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'matching_admin']));

CREATE POLICY "approved_recipients_insert_requests" ON public.item_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = recipient_id AND public.is_approved_user());

CREATE POLICY "recipients_cancel_own_requests" ON public.item_requests
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_id)
  WITH CHECK ((SELECT auth.uid()) = recipient_id);

CREATE POLICY "admins_update_item_requests" ON public.item_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'matching_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'matching_admin']));


--------------------------------------------------------------------------------
-- 8. MATCHES RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_view_matches" ON public.matches;
DROP POLICY IF EXISTS "Participants can view their matches" ON public.matches;
DROP POLICY IF EXISTS "matching_admins_view_matches" ON public.matches;
DROP POLICY IF EXISTS "matching_admins_insert_matches" ON public.matches;
DROP POLICY IF EXISTS "matching_admins_update_matches" ON public.matches;
DROP POLICY IF EXISTS "Matching and Super Admins can manage matches" ON public.matches;
DROP POLICY IF EXISTS "participants_update_matches" ON public.matches;

CREATE POLICY "participants_view_matches" ON public.matches
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = donor_id OR (SELECT auth.uid()) = recipient_id);

CREATE POLICY "matching_admins_view_matches" ON public.matches
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'matching_admin']));

CREATE POLICY "matching_admins_insert_matches" ON public.matches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'matching_admin']));

CREATE POLICY "matching_admins_update_matches" ON public.matches
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'matching_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin', 'matching_admin']));

CREATE POLICY "participants_update_matches" ON public.matches
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = donor_id OR (SELECT auth.uid()) = recipient_id)
  WITH CHECK ((SELECT auth.uid()) = donor_id OR (SELECT auth.uid()) = recipient_id);


--------------------------------------------------------------------------------
-- 9. AUDIT LOGS RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_insert_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "super_admins_read_audit_logs" ON public.audit_logs;

CREATE POLICY "admins_insert_audit_logs" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = admin_id AND public.is_admin());

CREATE POLICY "super_admins_read_audit_logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());


--------------------------------------------------------------------------------
-- 10. CONSENTS RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_consents" ON public.consents;
DROP POLICY IF EXISTS "users_insert_own_consents" ON public.consents;
DROP POLICY IF EXISTS "admins_read_consents" ON public.consents;

CREATE POLICY "users_read_own_consents" ON public.consents
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users_insert_own_consents" ON public.consents
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "admins_read_consents" ON public.consents
  FOR SELECT
  TO authenticated
  USING (public.is_admin());


--------------------------------------------------------------------------------
-- 11. ITEM IMAGES RLS POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_view_item_images" ON public.item_images;
DROP POLICY IF EXISTS "donors_insert_item_images" ON public.item_images;
DROP POLICY IF EXISTS "donors_delete_item_images" ON public.item_images;
DROP POLICY IF EXISTS "admins_manage_item_images" ON public.item_images;

CREATE POLICY "public_view_item_images" ON public.item_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "donors_insert_item_images" ON public.item_images
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_id AND items.donor_id = (SELECT auth.uid())
  ));

CREATE POLICY "donors_delete_item_images" ON public.item_images
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_id AND items.donor_id = (SELECT auth.uid())
  ));

CREATE POLICY "admins_manage_item_images" ON public.item_images
  FOR ALL
  TO authenticated
  USING (public.has_admin_role(ARRAY['super_admin', 'content_admin']));


--------------------------------------------------------------------------------
-- 12. TABLE GRANTS & DATA API EXPOSURE
--------------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.items, public.item_images TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

COMMIT;
