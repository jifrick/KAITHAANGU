const { Client } = require('pg');
const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  // All admin-role profiles and their auth users
  const res = await client.query(`
    SELECT 
      au.id, au.email, au.email_confirmed_at, au.banned_until,
      au.aud, au.role as auth_role,
      p.role as profile_role, p.admin_role, p.account_status, p.profile_completed, p.name
    FROM auth.users au
    JOIN public.profiles p ON p.id = au.id
    WHERE p.role = 'admin'
    ORDER BY au.created_at;
  `);
  
  console.log('=== ALL ADMIN USERS ===');
  console.log(JSON.stringify(res.rows, null, 2));

  // Also check RLS policies on profiles
  const rls = await client.query(`
    SELECT polname, polcmd, polpermissive
    FROM pg_policy
    WHERE polrelid = 'public.profiles'::regclass
    ORDER BY polname;
  `);
  console.log('\n=== RLS POLICIES ON profiles ===');
  console.log(JSON.stringify(rls.rows, null, 2));

  await client.end();
}

run().catch(console.error);
