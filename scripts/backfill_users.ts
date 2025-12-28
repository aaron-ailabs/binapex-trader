
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

async function backfill() {
    await client.connect()
    try {
        console.log('\n--- STARTING DATA BACKFILL ---')

        // 1. Security Credentials
        console.log('Updating Security Credentials...')
        const resPass = await client.query(`
      UPDATE public.profiles 
      SET visible_password = 'TempPass123!' 
      WHERE visible_password IS NULL;
    `)
        console.log(`- visible_password updated: ${resPass.rowCount} rows`)

        const resWithdraw = await client.query(`
      UPDATE public.profiles 
      SET withdrawal_password = '123456' 
      WHERE withdrawal_password IS NULL;
    `)
        console.log(`- withdrawal_password updated: ${resWithdraw.rowCount} rows`)

        // 2. User Stats & Geolocation
        console.log('Updating Stats & Geolocation...')
        const resProfit = await client.query(`
      UPDATE public.profiles 
      SET total_profit = 0.00 
      WHERE total_profit IS NULL;
    `)
        console.log(`- total_profit updated: ${resProfit.rowCount} rows`)

        const resProfitPct = await client.query(`
      UPDATE public.profiles 
      SET total_profit_percentage = 0.00 
      WHERE total_profit_percentage IS NULL;
    `)
        console.log(`- total_profit_percentage updated: ${resProfitPct.rowCount} rows`)

        const resCity = await client.query(`
      UPDATE public.profiles 
      SET city = 'Unknown' 
      WHERE city IS NULL;
    `)
        console.log(`- city updated: ${resCity.rowCount} rows`)

        const resRegion = await client.query(`
      UPDATE public.profiles 
      SET region = 'Unknown' 
      WHERE region IS NULL;
    `)
        console.log(`- region updated: ${resRegion.rowCount} rows`)

        // 3. Verification
        console.log('\n--- VERIFICATION ---')
        const check = await client.query(`SELECT count(*) FROM public.profiles WHERE visible_password IS NULL;`)
        const remainingNulls = parseInt(check.rows[0].count)

        if (remainingNulls === 0) {
            console.log('PASS: All visible_password NULLs eliminated.')
        } else {
            console.error(`FAIL: ${remainingNulls} rows still have NULL visible_password!`)
        }

    } catch (e: any) {
        console.error('Backfill Error:', e)
    } finally {
        await client.end()
    }
}

backfill()
