UPDATE public.profiles 
SET role = 'admin', 
    admin_role = 'super_admin',
    account_status = 'approved'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jifri.chakkalan@gmail.com'
);
