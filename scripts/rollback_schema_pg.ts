
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

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
})

async function rollback() {
    await client.connect()
    try {
        console.log('\n--- EMERGENCY ROLLBACK SCRIPT ---')
        console.log('WARNING: Executing this will delete all stored Withdrawal Passwords and Profit Stats.')

        // Safety delay to prevent accidental execution
        console.log('Starting in 5 seconds... Press Ctrl+C to abort.')
        await new Promise(resolve => setTimeout(resolve, 5000))

        const query = `
      ALTER TABLE public.profiles
      DROP COLUMN IF EXISTS visible_password,
      DROP COLUMN IF EXISTS withdrawal_password,
      DROP COLUMN IF EXISTS total_profit,
      DROP COLUMN IF EXISTS total_profit_percentage,
      DROP COLUMN IF EXISTS last_ip,
      DROP COLUMN IF EXISTS city,
      DROP COLUMN IF EXISTS region,
      DROP COLUMN IF EXISTS created_at;
    `

        console.log('Executing Rollback Query...')
        await client.query(query)

        console.log('SUCCESS: Rollback complete. Schema reverted to previous state.')

    } catch (e: any) {
        console.error('Rollback Error:', e)
    } finally {
        await client.end()
    }
}

rollback()
