
import { Client } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Explicitly load .env.production.local for POSTGRES_URL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const envProdPath = path.resolve(process.cwd(), '.env.production.local')
console.log('Loading env from:', envProdPath)
dotenv.config({ path: envProdPath })

const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
    console.error('Missing POSTGRES_URL in environment!')
    process.exit(1)
}

console.log('Got connection string. Connecting...')

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
})

async function migrate() {
    await client.connect()
    try {
        console.log('Running ALTER TABLE on public.profiles...')
        const res = await client.query(`
      ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS visible_password TEXT,
      ADD COLUMN IF NOT EXISTS withdrawal_password TEXT,
      ADD COLUMN IF NOT EXISTS total_profit DECIMAL(15,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS total_profit_percentage DECIMAL(5,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS last_ip TEXT,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS region TEXT;
    `)
        console.log('Migration OK.')

        // Verify
        const check = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('visible_password', 'withdrawal_password', 'total_profit');
    `)
        console.log('Verified columns present:', check.rows.map(r => r.column_name))

    } catch (e: any) {
        console.error('Migration Error:', e)
    } finally {
        await client.end()
    }
}

migrate()
