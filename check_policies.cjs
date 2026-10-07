const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkPolicies() {
  const { Client } = require('pg');
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.ucocrxnoucixoajalplg',
    password: 'f+4gkZd:Hu#d,hF'
  });
  
  try {
    await client.connect();
    const res = await client.query(`
      SELECT polname, polcmd, polroles, polqual, polwithcheck 
      FROM pg_policy 
      WHERE polrelid = 'public.profiles'::regclass;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkPolicies();
