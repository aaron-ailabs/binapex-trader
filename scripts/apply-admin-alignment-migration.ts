/**
 * Apply Admin Alignment Migration
 *
 * This script applies the admin alignment migration to the Supabase database.
 * It reads the migration file and executes it using the service role client.
 *
 * Usage: npx tsx scripts/apply-admin-alignment-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create service client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Applying Admin Alignment Migration...\n')

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260114000001_fix_admin_alignment.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded:', migrationPath)
    console.log('📊 Migration size:', migrationSQL.length, 'characters\n')

    // Split the migration into individual statements
    // We need to handle this carefully because of the $$ delimiters in functions
    const statements: string[] = []
    let currentStatement = ''
    let inFunction = false

    for (const line of migrationSQL.split('\n')) {
      // Skip comments and empty lines
      if (line.trim().startsWith('--') || line.trim() === '') {
        continue
      }

      currentStatement += line + '\n'

      // Track if we're inside a function definition
      if (line.includes('$$')) {
        inFunction = !inFunction
      }

      // If we hit a semicolon and we're not in a function, this is the end of a statement
      if (line.trim().endsWith(';') && !inFunction) {
        statements.push(currentStatement.trim())
        currentStatement = ''
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }

    console.log(`📝 Parsed ${statements.length} SQL statements\n`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip empty statements
      if (!statement) continue

      // Show progress
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ')
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).single()

        if (error) {
          // Try direct query instead
          const { error: queryError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0) // Just to test connection

          // If the error is that exec_sql doesn't exist, we need to use a different approach
          // Let's just execute the whole migration as one block
          throw new Error(`exec_sql not available: ${error.message}`)
        }

        successCount++
        console.log('   ✅ Success\n')
      } catch (err) {
        errorCount++
        console.error('   ❌ Error:', err instanceof Error ? err.message : String(err))
        console.error('   Statement:', statement.substring(0, 200), '...\n')
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log('='.repeat(80))

    if (errorCount === 0) {
      console.log('\n🎉 Migration applied successfully!')
      console.log('\nNext steps:')
      console.log('1. Verify schema changes in Supabase dashboard')
      console.log('2. Run verification queries from migration file')
      console.log('3. Test admin integration points')
    } else {
      console.log('\n⚠️  Some statements failed. Please review errors above.')
      console.log('You may need to apply this migration manually via Supabase dashboard.')
      console.log('\nTo apply manually:')
      console.log('1. Go to Supabase dashboard → SQL Editor')
      console.log('2. Paste contents of: supabase/migrations/20260114000001_fix_admin_alignment.sql')
      console.log('3. Execute the migration')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('\nManual migration required:')
    console.error('1. Go to Supabase dashboard → SQL Editor')
    console.error('2. Paste contents of: supabase/migrations/20260114000001_fix_admin_alignment.sql')
    console.error('3. Execute the migration')
    process.exit(1)
  }
}

// Run migration
applyMigration()
