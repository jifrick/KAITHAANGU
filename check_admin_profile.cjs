const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function checkAdminProfile() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT p.* 
      FROM auth.users au 
      JOIN public.profiles p ON p.id = au.id 
      WHERE au.email = 'kaithaangu-admin@admin.kaithaangu.com'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkAdminProfile();
