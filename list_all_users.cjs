const { Client } = require('pg');
const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  // ALL users regardless of role
  const res = await client.query(`
    SELECT 
      au.id, au.email, au.email_confirmed_at,
      au.aud, au.role as auth_role,
      p.role as profile_role, p.admin_role, p.account_status, p.profile_completed, p.name
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    ORDER BY au.created_at;
  `);
  
  console.log('=== ALL AUTH USERS ===');
  console.log(JSON.stringify(res.rows, null, 2));

  await client.end();
}

run().catch(console.error);
