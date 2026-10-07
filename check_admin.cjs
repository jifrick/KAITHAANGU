const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function checkAdmin() {
  const client = new Client({
    connectionString
  });

  try {
    await client.connect();
    
    const query = `
      SELECT 
        au.id as auth_uid, 
        au.email, 
        p.id as profile_id, 
        p.role, 
        p.admin_role, 
        p.account_status, 
        p.profile_completed 
      FROM auth.users au
      LEFT JOIN public.profiles p ON au.id = p.id
      WHERE au.email = 'jifri.chakkalan@gmail.com';
    `;
    
    const res = await client.query(query);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAdmin();
