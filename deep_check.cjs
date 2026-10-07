const { Client } = require('pg');
const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  // ALL auth users - including duplicates
  const users = await client.query(`
    SELECT id, email, aud, role as auth_role, 
           raw_app_meta_data->>'provider' as provider,
           email_confirmed_at,
           created_at
    FROM auth.users 
    ORDER BY created_at
  `);
  console.log('=== ALL AUTH USERS ===');
  console.log(JSON.stringify(users.rows, null, 2));

  // ALL profiles
  const profiles = await client.query(`
    SELECT id, name, role, admin_role, account_status, profile_completed
    FROM public.profiles
    ORDER BY created_at
  `);
  console.log('\n=== ALL PROFILES ===');
  console.log(JSON.stringify(profiles.rows, null, 2));

  await client.end();
}
run().catch(console.error);
