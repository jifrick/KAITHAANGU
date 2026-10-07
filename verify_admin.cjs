const { Client } = require('pg');
const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function verifyAndFix() {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    // Check the admin user's auth record
    const res = await client.query(`
      SELECT id, email, aud, role, email_confirmed_at, banned_until
      FROM auth.users 
      WHERE email = 'kaithaangu-admin@admin.kaithaangu.com'
    `);
    console.log('Auth user record:', JSON.stringify(res.rows, null, 2));

    // Ensure email_confirmed_at is set and aud/role are correct
    await client.query(`
      UPDATE auth.users 
      SET 
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        banned_until = NULL,
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
      WHERE email = 'kaithaangu-admin@admin.kaithaangu.com'
    `);
    console.log('Auth user record patched successfully.');

    // Verify profile exists
    const profileRes = await client.query(`
      SELECT id, role, admin_role, account_status, profile_completed
      FROM public.profiles
      WHERE id IN (SELECT id FROM auth.users WHERE email = 'kaithaangu-admin@admin.kaithaangu.com')
    `);
    console.log('Profile record:', JSON.stringify(profileRes.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

verifyAndFix();
