// Script to fix admin role for admin88@binapex.my
// Run with: node scripts/fix-admin-role.js

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminRole() {
  console.log('🔧 Fixing admin role for admin88@binapex.my...\n');

  try {
    // Step 1: Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    const adminUser = authUsers.users.find(u => u.email === 'admin88@binapex.my');
    
    if (!adminUser) {
      console.error('❌ User admin88@binapex.my not found in auth.users');
      console.log('Please create the user first through Supabase Auth dashboard or sign-up page.');
      return;
    }

    console.log('✅ User found in auth.users');
    console.log('   User ID:', adminUser.id);
    console.log('   Email:', adminUser.email);

    // Step 2: Update role in profiles table
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.id)
      .select();

    if (updateError) {
      console.error('\n❌ Error updating role:', updateError.message);
      return;
    }

    console.log('\n✅ Admin role assigned successfully!');

    // Step 3: Verify the update
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, role, email, updated_at')
      .eq('id', adminUser.id)
      .single();

    if (verifyError) {
      console.error('\n❌ Error verifying update:', verifyError.message);
      return;
    }

    console.log('\n📋 Updated Profile:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email || adminUser.email);
    console.log('   Role:', profile.role);
    console.log('   Updated:', new Date(profile.updated_at).toLocaleString());

    // Step 4: Test is_admin RPC
    console.log('\n🧪 Testing is_admin RPC...');
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
    
    if (rpcError) {
      console.error('❌ RPC is_admin Error:', rpcError.message);
    } else {
      console.log('✅ is_admin RPC returns:', isAdmin);
    }

    // Step 5: Test get_user_role RPC (used in AdminRoute)
    console.log('\n🧪 Testing get_user_role RPC...');
    const { data: role, error: roleRpcError } = await supabase.rpc('get_user_role');
    
    if (roleRpcError) {
      console.error('❌ RPC get_user_role Error:', roleRpcError.message);
    } else {
      console.log('✅ get_user_role RPC returns:', role);
      if (role !== 'admin') {
        console.warn('⚠️ WARNING: get_user_role did NOT return "admin"!');
      }
    }

console.log('\n✅ Admin role fix completed! You can now log in to the admin portal.');
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

fixAdminRole();
