import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

async function checkSchemaPg() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING,
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    console.log('Connected to Postgres via direct URL.');

    try {
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Public tables:', res.rows.map(r => r.table_name).join(', '));

        const migrationTableRes = await client.query(`
      SELECT count(*) FROM information_schema.tables WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    `);

        if (migrationTableRes.rows[0].count > 0) {
            const appliedMigrations = await client.query(`SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC`);
            console.log('Applied migrations versions count:', appliedMigrations.rows.length);
            console.log('Latest migration:', appliedMigrations.rows[0]?.version);
        } else {
            console.log('No supabase_migrations.schema_migrations table found.');
        }
    } catch (err: any) {
        console.error('Schema check error:', err.message);
    } finally {
        await client.end();
    }
}

checkSchemaPg();
