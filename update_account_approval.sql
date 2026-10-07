-- 1. Create account_status enum
DO $$ BEGIN
    CREATE TYPE public.account_status_type AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Enum added in update_enum.sql

-- 3. Add account_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status public.account_status_type DEFAULT 'pending' NOT NULL;

-- 4. Create trigger to prevent users from updating sensitive fields
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_updates()
RETURNS trigger AS $$
BEGIN
  -- If the user modifying is an admin, allow the update
  IF public.has_admin_role(ARRAY['super_admin', 'verification_admin', 'support_moderator']) THEN
    RETURN NEW;
  END IF;

  -- Otherwise, it is a normal user updating their own profile.
  -- Force sensitive fields to remain unchanged
  NEW.account_status = OLD.account_status;
  NEW.admin_role = OLD.admin_role;
  -- Do not let them change their role once profile_completed is true
  IF OLD.profile_completed = true THEN
    NEW.role = OLD.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_sensitive_updates ON public.profiles;
CREATE TRIGGER trg_prevent_sensitive_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_sensitive_profile_updates();

-- 5. Helper function for approved users
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND account_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update Items RLS to require approved status
DROP POLICY IF EXISTS "Anyone can view items" ON public.items;
CREATE POLICY "Approved users can view items" ON public.items
  FOR SELECT USING (public.is_approved_user());

DROP POLICY IF EXISTS "Donors can insert items" ON public.items;
CREATE POLICY "Approved donors can insert items" ON public.items
  FOR INSERT WITH CHECK (
    public.is_approved_user() AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'donor' OR role = 'both')))
  );

DROP POLICY IF EXISTS "Donors can update their own items" ON public.items;
CREATE POLICY "Approved donors can update their own items" ON public.items
  FOR UPDATE USING (
    public.is_approved_user() AND auth.uid() = donor_id
  );

-- 7. Audit log action for account approval uses text column, no enum needed

-- Update trigger for handle_new_user to ensure defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, account_status, profile_completed)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Anonymous'), 'donor', 'pending', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
