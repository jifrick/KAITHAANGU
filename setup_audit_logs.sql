-- Audit Logs RLS
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.has_admin_role(ARRAY['super_admin'])
  );

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    public.has_admin_role(ARRAY['super_admin', 'verification_admin', 'content_admin', 'matching_admin', 'support_moderator'])
  );

-- NO UPDATE OR DELETE POLICIES
