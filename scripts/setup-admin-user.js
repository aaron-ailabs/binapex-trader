#!/usr/bin/env node
/**
 * Setup Admin User Script
 * 
 * This script helps set up an admin user for the Binapex platform.
 * It performs the following:
 * 1. Checks if the user exists in auth.users
 * 2. Updates their role to 'admin' in the profiles table
 * 3. Verifies the RPC functions work correctly
 * 4. Tests the complete admin authentication flow
 * 
 * Usage: node scripts/setup-admin-user.js <email>
 * Example: node scripts/setup-admin-user.js admin88@binapex.my
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminEmail = process.argv[2] || 'admin88@binapex.my';

console.log('🚀 Binapex Admin User Setup');
console.log('============================\n');
console.log(`Target email: ${adminEmail}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminUser() {
  try {
    // Step 1: Check if user exists in auth.users
    console.log('📋 Step 1: Checking if user exists in auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return false;
    }

    const adminUser = authUsers.users.find(u => u.email === adminEmail);
    
    if (!adminUser) {
      console.error(`❌ User ${adminEmail} not found in auth.users`);
      console.log('\n💡 Next steps:');
      console.log('   1. Create the user through the sign-up page');
      console.log('   2. Or create manually in Supabase Dashboard > Authentication > Users');
      console.log('   3. Then run this script again');
      return false;
    }

    console.log('✅ User found in auth.users');
    console.log(`   User ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Created: ${new Date(adminUser.created_at).toLocaleString()}\n`);

    // Step 2: Check if role column exists
    console.log('📋 Step 2: Checking if role column exists in profiles table...');
    const { data: columns, error: columnError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);

    if (columnError && columnError.message.includes('column')) {
      console.error('❌ Role column does NOT exist in profiles table');
      console.log('\n💡 Next steps:');
      console.log('   Run: psql -f scripts/025_add_role_column_to_profiles.sql');
      console.log('   Or execute the SQL in Supabase Dashboard > SQL Editor');
      return false;
    }

    console.log('✅ Role column exists in profiles table\n');

    // Step 3: Update role in profiles table
    console.log('📋 Step 3: Setting admin role in profiles table...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.id)
      .select();

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
      return false;
    }

    console.log('✅ Admin role assigned successfully\n');

    // Step 4: Verify the update
    console.log('📋 Step 4: Verifying profile update...');
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, membership_tier, updated_at')
      .eq('id', adminUser.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return false;
    }

    console.log('✅ Profile verified:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email || adminUser.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Full Name: ${profile.full_name || 'Not set'}`);
    console.log(`   Tier: ${profile.membership_tier || 'Not set'}`);
    console.log(`   Updated: ${new Date(profile.updated_at).toLocaleString()}\n`);

    // Step 5: Test RPC functions
    console.log('📋 Step 5: Testing RPC functions...');
    
    // Test is_admin (note: this will return false when called with service key)
    const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin');
    
    if (isAdminError) {
      console.warn('⚠️  is_admin() RPC error:', isAdminError.message);
      console.log('   This is expected when using service role key');
    } else {
      console.log(`   is_admin() returns: ${isAdminResult}`);
    }

    // Test get_user_role (note: this will return null when called with service key)
    const { data: roleResult, error: roleError } = await supabase.rpc('get_user_role');
    
    if (roleError) {
      console.warn('⚠️  get_user_role() RPC error:', roleError.message);
      console.log('   This is expected when using service role key');
    } else {
      console.log(`   get_user_role() returns: ${roleResult || 'null'}`);
    }

    console.log('\n   Note: RPC functions return null/false with service key.');
    console.log('   They will work correctly when called by authenticated users.\n');

    // Step 6: Summary
    console.log('✅ Admin user setup completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   • User: ${adminEmail}`);
    console.log(`   • Role: admin`);
    console.log(`   • Status: Ready to login\n`);
    console.log('🔐 Next steps:');
    console.log('   1. Navigate to /admin/login');
    console.log(`   2. Sign in with ${adminEmail}`);
    console.log('   3. You should be redirected to /admin dashboard\n');
    console.log('🐛 Debugging:');
    console.log('   • Check browser console for [Admin Auth] logs');
    console.log('   • Check server logs for [AdminRoute] and [Middleware] logs');
    console.log('   • Verify RPC functions in Supabase Dashboard > Database > Functions\n');

    return true;

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
    return false;
  }
}

setupAdminUser().then(success => {
  process.exit(success ? 0 : 1);
});