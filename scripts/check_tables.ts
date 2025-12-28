
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log('Checking tables on:', supabaseUrl)

    // Check profiles
    console.log('\nChecking public.profiles...')
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1)
    if (profilesError) {
        console.log('Error checking profiles:', profilesError.message)
    } else {
        console.log('Profiles table FOUND. Sample headers:', Object.keys(profiles[0] || {}))
    }

    // Check users
    console.log('\nChecking public.users...')
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1)
    if (usersError) {
        console.log('Error checking users:', usersError.message)
    } else {
        console.log('Users table FOUND. Sample headers:', Object.keys(users[0] || {}))
    }
}

checkTables()
