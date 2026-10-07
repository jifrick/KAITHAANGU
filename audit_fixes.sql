-- 1. Fix: Restrict public access to all profile data (IDOR fix)
DROP POLICY IF EXISTS "Public can view limited donor info" ON public.profiles;

-- 2. Fix: Prevent Donors from bypassing item moderation (Privilege Escalation fix)
CREATE OR REPLACE FUNCTION prevent_donor_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change item status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_item_status_transition ON public.items;
CREATE TRIGGER enforce_item_status_transition
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION prevent_donor_status_change();

-- 3. Fix: Matching Race Condition - Prevent multiple matches for a single item
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_item_id_key;
ALTER TABLE public.matches ADD CONSTRAINT matches_item_id_key UNIQUE (item_id);

-- 4. Fix: Audit log immutability - Prevent deletion of audit logs if admin is deleted
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ALTER COLUMN admin_id DROP NOT NULL;
