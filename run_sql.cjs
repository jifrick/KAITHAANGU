const fs = require('fs');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ucocrxnoucixoajalplg:f%2B4gkZd%3AHu%23d%2ChF@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const sql = fs.readFileSync('reset_rls.sql', 'utf8');
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await client.end();
  }
}

run();
