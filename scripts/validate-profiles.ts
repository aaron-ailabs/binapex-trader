import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

async function validateTable() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING,
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
        console.log('Profiles columns:', res.rows.map(r => r.column_name).join(', '));

        const checkWithdrawal = res.rows.find(r => r.column_name === 'withdrawal_password');
        console.log('withdrawal_password column exists:', !!checkWithdrawal);

        const checkRLS = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      join pg_namespace on pg_namespace.oid = pg_class.relnamespace
      WHERE relname = 'profiles' AND nspname = 'public'
    `);
        console.log('Profiles RLS enabled:', checkRLS.rows[0]?.relrowsecurity);
    } catch (err: any) {
        console.error('Validation error:', err.message);
    } finally {
        await client.end();
    }
}

validateTable();
